import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog.js';
import TimeEntry from '../models/TimeEntry.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

class MemberService {
  // =============================================
  // Module 6: Productivity Pulse
  // =============================================

  async getProductivityScore(userId, period = '7d') {
    const { startDate, endDate } = this._periodToDates(period);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const matchStage = {
      user: userObjId,
      intervalStart: { $gte: startDate, $lte: endDate },
    };

    const [scoreAgg, dailyTrend, topHours] = await Promise.all([
      // Overall score using the formula: (productive + neutral×0.5) / total × 100
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            productive: {
              $sum: { $cond: [{ $gte: ['$overallActivity', 75] }, 1, 0] },
            },
            neutral: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$overallActivity', 50] },
                      { $lt: ['$overallActivity', 75] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total: { $sum: 1 },
            avgMouse: { $avg: '$mouseActivity' },
            avgKeyboard: { $avg: '$keyboardActivity' },
            avgOverall: { $avg: '$overallActivity' },
            totalDuration: { $sum: '$intervalDuration' },
          },
        },
      ]),

      // Daily trend
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$intervalStart' } },
            productive: {
              $sum: { $cond: [{ $gte: ['$overallActivity', 75] }, 1, 0] },
            },
            neutral: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gte: ['$overallActivity', 50] },
                      { $lt: ['$overallActivity', 75] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            total: { $sum: 1 },
            avgOverall: { $avg: '$overallActivity' },
            avgMouse: { $avg: '$mouseActivity' },
            avgKeyboard: { $avg: '$keyboardActivity' },
            totalDuration: { $sum: '$intervalDuration' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top productive hours
      ActivityLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $hour: '$intervalStart' },
            avgActivity: { $avg: '$overallActivity' },
            intervalCount: { $sum: 1 },
          },
        },
        { $sort: { avgActivity: -1 } },
        { $limit: 3 },
        {
          $project: {
            hour: '$_id',
            avgActivity: { $round: ['$avgActivity', 1] },
            intervalCount: 1,
          },
        },
      ]),
    ]);

    // Compute overall score
    const stats = scoreAgg[0] || { productive: 0, neutral: 0, total: 0, avgMouse: 0, avgKeyboard: 0, avgOverall: 0, totalDuration: 0 };
    const score = stats.total > 0
      ? Math.round(((stats.productive + stats.neutral * 0.5) / stats.total) * 100)
      : 0;

    // Build daily trend with per-day scores
    const trend = dailyTrend.map((day) => ({
      date: day._id,
      score: day.total > 0 ? Math.round(((day.productive + day.neutral * 0.5) / day.total) * 100) : 0,
      avgOverall: +day.avgOverall.toFixed(1),
      avgMouse: +day.avgMouse.toFixed(1),
      avgKeyboard: +day.avgKeyboard.toFixed(1),
      totalDuration: day.totalDuration,
      intervalCount: day.total,
    }));

    // Streak calculation — consecutive days with score >= 50
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < trend.length; i++) {
      if (trend[i].score >= 50) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    // Current streak counts from the most recent day backwards
    for (let i = trend.length - 1; i >= 0; i--) {
      if (trend[i].score >= 50) currentStreak++;
      else break;
    }

    const days = period === '14d' ? 14 : period === '30d' ? 30 : 7;

    return {
      score,
      period,
      dailyTrend: trend,
      categoryBreakdown: {
        avgMouse: +(stats.avgMouse || 0).toFixed(1),
        avgKeyboard: +(stats.avgKeyboard || 0).toFixed(1),
        avgOverall: +(stats.avgOverall || 0).toFixed(1),
      },
      topProductiveHours: topHours,
      streak: { current: currentStreak, best: bestStreak },
      summary: {
        totalIntervals: stats.total,
        totalDurationSeconds: stats.totalDuration,
        periodDays: days,
      },
    };
  }

  async getPeerComparison(userId, userRole, period = '7d') {
    const { startDate, endDate } = this._periodToDates(period);

    // Get all active users with same role
    const peers = await User.find({ role: userRole, isActive: true }, '_id').lean();
    const peerIds = peers.map((p) => p._id);

    if (peerIds.length === 0) {
      return { userScore: 0, rank: 0, percentile: 0, teamAverage: 0, teamSize: 0, histogram: [] };
    }

    // Aggregate scores for all peers
    const peerScores = await ActivityLog.aggregate([
      {
        $match: {
          user: { $in: peerIds },
          intervalStart: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$user',
          productive: {
            $sum: { $cond: [{ $gte: ['$overallActivity', 75] }, 1, 0] },
          },
          neutral: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$overallActivity', 50] },
                    { $lt: ['$overallActivity', 75] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          total: { $sum: 1 },
        },
      },
    ]);

    // Compute score for each peer
    const scored = peerScores.map((p) => ({
      userId: p._id.toString(),
      score: p.total > 0 ? Math.round(((p.productive + p.neutral * 0.5) / p.total) * 100) : 0,
    }));
    scored.sort((a, b) => b.score - a.score);

    const userIdStr = userId.toString();
    const userEntry = scored.find((s) => s.userId === userIdStr);
    const userScore = userEntry ? userEntry.score : 0;
    const rank = userEntry ? scored.indexOf(userEntry) + 1 : scored.length + 1;
    const percentile = scored.length > 0 ? Math.round(((scored.length - rank + 1) / scored.length) * 100) : 0;
    const teamAverage = scored.length > 0
      ? Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length)
      : 0;

    // Build histogram buckets (anonymized)
    const buckets = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 },
    ];
    const histogram = buckets.map((b) => ({
      range: b.range,
      count: scored.filter((s) => s.score >= b.min && s.score <= b.max).length,
    }));

    return {
      userScore,
      rank,
      percentile,
      teamAverage,
      teamSize: scored.length,
      histogram,
      period,
    };
  }

  async getActivityHeatmap(userId, period = '7d') {
    const { startDate, endDate } = this._periodToDates(period);

    const heatmapData = await ActivityLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          intervalStart: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$intervalStart' },
            hour: { $hour: '$intervalStart' },
          },
          avgActivity: { $avg: '$overallActivity' },
          intervalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          dayOfWeek: '$_id.dayOfWeek',
          hour: '$_id.hour',
          avgActivity: { $round: ['$avgActivity', 1] },
          intervalCount: 1,
        },
      },
      { $sort: { dayOfWeek: 1, hour: 1 } },
    ]);

    // Build 7x24 grid (0=Sun, 6=Sat)
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    const counts = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const item of heatmapData) {
      const dayIdx = item.dayOfWeek - 1;
      grid[dayIdx][item.hour] = item.avgActivity;
      counts[dayIdx][item.hour] = item.intervalCount;
    }

    return { grid, counts, period };
  }

  async getTopApps(userId, period = '7d', limit = 10) {
    const { startDate, endDate } = this._periodToDates(period);

    const appRanking = await ActivityLog.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          intervalStart: { $gte: startDate, $lte: endDate },
          'activeWindows.0': { $exists: true },
        },
      },
      { $unwind: '$activeWindows' },
      {
        $group: {
          _id: '$activeWindows.appName',
          totalDuration: { $sum: '$activeWindows.duration' },
          sessionCount: { $sum: 1 },
        },
      },
      {
        $project: {
          appName: '$_id',
          totalDuration: 1,
          sessionCount: 1,
        },
      },
      { $sort: { totalDuration: -1 } },
      { $limit: limit },
    ]);

    const grandTotal = appRanking.reduce((s, a) => s + a.totalDuration, 0);

    return {
      apps: appRanking.map((a) => ({
        ...a,
        percentage: grandTotal > 0 ? +((a.totalDuration / grandTotal) * 100).toFixed(1) : 0,
      })),
      summary: {
        totalAppsTracked: appRanking.length,
        totalDuration: grandTotal,
      },
      period,
    };
  }

  // =============================================
  // Module 7: Break Analytics
  // =============================================

  async getBreakAnalytics(userId, period = '7d') {
    const { startDate, endDate } = this._periodToDates(period);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const entryMatch = {
      user: userObjId,
      status: 'completed',
      startTime: { $gte: startDate, $lte: endDate },
    };

    const [breakAgg, entries] = await Promise.all([
      // In-session breaks from breaks[] array
      TimeEntry.aggregate([
        { $match: entryMatch },
        { $unwind: { path: '$breaks', preserveNullAndEmptyArrays: false } },
        { $match: { 'breaks.endedAt': { $ne: null } } },
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$breaks.startedAt' } },
            breakDurationMs: { $subtract: ['$breaks.endedAt', '$breaks.startedAt'] },
            hour: { $hour: '$breaks.startedAt' },
          },
        },
        {
          $group: {
            _id: '$date',
            breakCount: { $sum: 1 },
            totalBreakMs: { $sum: '$breakDurationMs' },
            morningBreaks: { $sum: { $cond: [{ $lt: ['$hour', 12] }, 1, 0] } },
            afternoonBreaks: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$hour', 12] }, { $lt: ['$hour', 17] }] },
                  1,
                  0,
                ],
              },
            },
            eveningBreaks: { $sum: { $cond: [{ $gte: ['$hour', 17] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Raw entries for gap detection
      TimeEntry.find(entryMatch)
        .select('startTime endTime')
        .sort({ startTime: 1 })
        .lean(),
    ]);

    // Gap detection: gaps >= 5min between consecutive entries
    const GAP_THRESHOLD_MS = 5 * 60 * 1000;
    const gaps = [];
    let longestNoBreakMs = 0;
    let currentNoBreakMs = 0;

    for (let i = 0; i < entries.length; i++) {
      if (i > 0) {
        const gapMs = new Date(entries[i].startTime) - new Date(entries[i - 1].endTime);
        if (gapMs >= GAP_THRESHOLD_MS) {
          gaps.push({ gapMinutes: Math.round(gapMs / 60000) });
          currentNoBreakMs = 0;
        } else {
          // Continuous work — add previous entry duration + gap
          currentNoBreakMs += (new Date(entries[i - 1].endTime) - new Date(entries[i - 1].startTime)) + Math.max(gapMs, 0);
        }
      }
      if (i === entries.length - 1 || i === 0) {
        currentNoBreakMs += new Date(entries[i].endTime) - new Date(entries[i].startTime);
      }
      longestNoBreakMs = Math.max(longestNoBreakMs, currentNoBreakMs);
    }

    // Compute summary
    const totalDays = breakAgg.length || 1;
    const totalBreaks = breakAgg.reduce((s, d) => s + d.breakCount, 0);
    const totalBreakMs = breakAgg.reduce((s, d) => s + d.totalBreakMs, 0);

    const timingDistribution = {
      morning: breakAgg.reduce((s, d) => s + d.morningBreaks, 0),
      afternoon: breakAgg.reduce((s, d) => s + d.afternoonBreaks, 0),
      evening: breakAgg.reduce((s, d) => s + d.eveningBreaks, 0),
    };

    const dailyPattern = breakAgg.map((d) => ({
      date: d._id,
      breakCount: d.breakCount,
      totalBreakSeconds: Math.round(d.totalBreakMs / 1000),
    }));

    return {
      summary: {
        avgBreaksPerDay: +(totalBreaks / totalDays).toFixed(1),
        avgBreakDurationSeconds: totalBreaks > 0 ? Math.round(totalBreakMs / totalBreaks / 1000) : 0,
        totalBreakTimeSeconds: Math.round(totalBreakMs / 1000),
        longestNoBreakMinutes: Math.round(longestNoBreakMs / 60000),
        totalGapBreaks: gaps.length,
        avgGapDurationMinutes: gaps.length > 0
          ? Math.round(gaps.reduce((s, g) => s + g.gapMinutes, 0) / gaps.length)
          : 0,
      },
      dailyPattern,
      timingDistribution,
      gapBreaks: gaps,
      period,
    };
  }

  async getBreakRecommendations(userId, period = '7d') {
    const analytics = await this.getBreakAnalytics(userId, period);
    const { summary, timingDistribution } = analytics;
    const recommendations = [];

    if (summary.avgBreaksPerDay < 2) {
      recommendations.push({
        type: 'low_frequency',
        title: 'Take More Breaks',
        message: `You average ${summary.avgBreaksPerDay} breaks per day. Regular breaks (every 60-90 min) improve focus and reduce fatigue.`,
        severity: 'high',
      });
    }

    if (summary.longestNoBreakMinutes > 120) {
      recommendations.push({
        type: 'long_stretch',
        title: 'Long Work Stretch Detected',
        message: `You worked ${summary.longestNoBreakMinutes} minutes without a break. Try a 5-10 minute break every 60-90 minutes.`,
        severity: 'high',
      });
    }

    if (summary.avgBreakDurationSeconds > 0 && summary.avgBreakDurationSeconds < 300) {
      recommendations.push({
        type: 'short_breaks',
        title: 'Breaks Too Short',
        message: `Your breaks average under 5 minutes. Longer breaks (10-15 min) are more restorative for sustained productivity.`,
        severity: 'medium',
      });
    }

    if (timingDistribution.morning === 0 && (timingDistribution.afternoon > 0 || timingDistribution.evening > 0)) {
      recommendations.push({
        type: 'no_morning_breaks',
        title: 'No Morning Breaks',
        message: 'You don\'t take breaks in the morning. A mid-morning break around 10:30 AM can boost afternoon productivity.',
        severity: 'medium',
      });
    }

    const totalBreaks = timingDistribution.morning + timingDistribution.afternoon + timingDistribution.evening;
    if (totalBreaks > 0 && timingDistribution.afternoon > (timingDistribution.morning + timingDistribution.evening)) {
      recommendations.push({
        type: 'uneven_distribution',
        title: 'Uneven Break Distribution',
        message: 'Most of your breaks are clustered in the afternoon. Try distributing breaks more evenly throughout the day.',
        severity: 'low',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'good_habits',
        title: 'Great Break Habits',
        message: 'Your break patterns look healthy! Keep maintaining regular breaks throughout the day.',
        severity: 'info',
      });
    }

    return {
      recommendations,
      period,
      generatedAt: new Date(),
    };
  }

  async getBreakSettings(userId) {
    const user = await User.findById(userId).select('breakSettings').lean();
    if (!user) throw ApiError.notFound('User not found');

    return user.breakSettings || {
      breakInterval: 60,
      breakDuration: 10,
      mode: 'flexible',
      enabled: true,
    };
  }

  async updateBreakSettings(userId, updates) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (!user.breakSettings) {
      user.breakSettings = { breakInterval: 60, breakDuration: 10, mode: 'flexible', enabled: true };
    }

    if (updates.breakInterval !== undefined) user.breakSettings.breakInterval = updates.breakInterval;
    if (updates.breakDuration !== undefined) user.breakSettings.breakDuration = updates.breakDuration;
    if (updates.mode !== undefined) user.breakSettings.mode = updates.mode;
    if (updates.enabled !== undefined) user.breakSettings.enabled = updates.enabled;

    await user.save();
    return user.breakSettings;
  }

  // =============================================
  // Private helpers
  // =============================================

  _periodToDates(period) {
    const endDate = new Date();
    const days = period === '14d' ? 14 : period === '30d' ? 30 : 7;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  }
}

const memberService = new MemberService();
export default memberService;
