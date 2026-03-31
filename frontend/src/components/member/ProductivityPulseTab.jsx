import { useState, useEffect, useCallback } from 'react';
import useMemberActivity from '../../hooks/useMemberActivity';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getHeatmapColor = (value) => {
  if (value === 0) return 'bg-white/[0.03]';
  if (value < 20) return 'bg-red-500/30';
  if (value < 40) return 'bg-amber-500/25';
  if (value < 60) return 'bg-cyan-500/20';
  if (value < 80) return 'bg-emerald-500/30';
  return 'bg-emerald-500/50';
};

const getScoreColor = (score) => {
  if (score >= 70) return { text: 'text-emerald-400', stroke: 'rgba(16,185,129,0.5)', glow: 'rgba(16,185,129,0.3)' };
  if (score >= 50) return { text: 'text-cyan-400', stroke: 'rgba(6,182,212,0.5)', glow: 'rgba(6,182,212,0.3)' };
  if (score >= 30) return { text: 'text-amber-400', stroke: 'rgba(245,158,11,0.5)', glow: 'rgba(245,158,11,0.3)' };
  return { text: 'text-red-400', stroke: 'rgba(239,68,68,0.5)', glow: 'rgba(239,68,68,0.3)' };
};

const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '30 Days' },
];

const ProductivityPulseTab = () => {
  const {
    productivityScore, productivityLoading, loadProductivityScore,
    peerComparison, peerLoading, loadPeerComparison,
    heatmapData, heatmapLoading, loadHeatmap,
    topApps, appsLoading, loadTopApps,
  } = useMemberActivity();

  const [period, setPeriod] = useState('7d');

  const loadData = useCallback(() => {
    loadProductivityScore(period);
    loadPeerComparison(period);
    loadHeatmap(period);
    loadTopApps(period);
  }, [period, loadProductivityScore, loadPeerComparison, loadHeatmap, loadTopApps]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loading = productivityLoading || peerLoading || heatmapLoading || appsLoading;
  const score = productivityScore?.score || 0;
  const colors = getScoreColor(score);
  const trend = productivityScore?.dailyTrend || [];
  const breakdown = productivityScore?.categoryBreakdown || {};
  const streak = productivityScore?.streak || { current: 0, best: 0 };
  const topHours = productivityScore?.topProductiveHours || [];
  const grid = heatmapData?.grid || [];
  const apps = topApps?.apps || [];
  const peer = peerComparison;

  // SVG score ring
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  const maxTrendScore = trend.length > 0 ? Math.max(...trend.map((d) => d.score), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
              period === p.value
                ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : !productivityScore ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p className="text-[14px] font-medium">No activity data available</p>
          <p className="text-[12px] text-white/20 mt-1">Install the desktop agent to start tracking productivity</p>
        </div>
      ) : (
        <>
          {/* Score Ring + Summary */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Ring */}
              <div className="relative w-40 h-40 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                  <circle
                    cx="60" cy="60" r={RADIUS} fill="none"
                    stroke={colors.stroke} strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000"
                    style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${colors.text}`}>{score}</span>
                  <span className="text-[11px] text-white/30 font-medium">Score</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 flex-1 w-full">
                {[
                  { label: 'Mouse Activity', value: `${breakdown.avgMouse || 0}%`, color: 'cyan' },
                  { label: 'Keyboard Activity', value: `${breakdown.avgKeyboard || 0}%`, color: 'purple' },
                  { label: 'Current Streak', value: `${streak.current} days`, color: 'emerald' },
                  { label: 'Best Streak', value: `${streak.best} days`, color: 'amber' },
                ].map((card) => (
                  <div key={card.label} className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-3 text-center">
                    <p className="text-[11px] text-white/30 font-medium mb-1">{card.label}</p>
                    <p className={`text-[18px] font-bold text-${card.color}-400`}>{card.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Productive Hours */}
            {topHours.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/30 font-medium mb-2">Most Productive Hours</p>
                <div className="flex gap-3">
                  {topHours.map((h, i) => (
                    <div key={h.hour} className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-3 py-1.5">
                      <span className={`text-[12px] font-bold ${i === 0 ? 'text-emerald-400' : 'text-white/50'}`}>
                        {h.hour}:00
                      </span>
                      <span className="text-[11px] text-white/25">{h.avgActivity}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily Trend */}
          {trend.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Daily Productivity</h3>
              <div className="flex items-end gap-1.5 h-32">
                {trend.map((day) => {
                  const heightPct = maxTrendScore > 0 ? (day.score / maxTrendScore) * 100 : 0;
                  const barColor = day.score >= 70 ? 'bg-emerald-500/50' : day.score >= 50 ? 'bg-cyan-500/40' : day.score >= 30 ? 'bg-amber-500/40' : 'bg-red-500/40';
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                      <span className="text-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.score}%
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${barColor} hover:opacity-80`}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="text-[8px] text-white/15 font-mono truncate w-full text-center">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Trend summary */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                <span className="text-[11px] text-white/25">
                  Total tracked: {formatDuration(productivityScore?.summary?.totalDurationSeconds || 0)}
                </span>
                <span className="text-[11px] text-white/25">
                  {productivityScore?.summary?.totalIntervals || 0} intervals
                </span>
              </div>
            </div>
          )}

          {/* Peer Comparison */}
          {peer && peer.teamSize > 1 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Peer Comparison</h3>
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Percentile badge */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="text-[36px] font-bold text-cyan-400">{peer.percentile}%</span>
                  <span className="text-[12px] text-white/30">Percentile</span>
                  <span className="text-[11px] text-white/20 mt-1">
                    Rank #{peer.rank} of {peer.teamSize}
                  </span>
                </div>

                {/* Histogram */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-white/30">Score Distribution</span>
                    <span className="text-[11px] text-white/20">Team avg: {peer.teamAverage}%</span>
                  </div>
                  <div className="space-y-2">
                    {(peer.histogram || []).map((bucket) => {
                      const maxCount = Math.max(...(peer.histogram || []).map((b) => b.count), 1);
                      const pct = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
                      const isUserBucket = peer.userScore >= parseInt(bucket.range) && peer.userScore <= parseInt(bucket.range.split('-')[1]);
                      return (
                        <div key={bucket.range}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[12px] font-mono ${isUserBucket ? 'text-cyan-400 font-semibold' : 'text-white/40'}`}>
                              {bucket.range}%
                            </span>
                            <span className="text-[11px] text-white/25">{bucket.count} members</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isUserBucket
                                  ? 'bg-gradient-to-r from-cyan-500/80 to-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                  : 'bg-gradient-to-r from-white/15 to-white/10'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Heatmap */}
          {grid.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Activity Heatmap</h3>
              <div className="overflow-x-auto">
                {/* Hour labels */}
                <div className="flex mb-1 pl-10">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-center text-[9px] text-white/20 font-mono min-w-[20px]">
                      {h}
                    </div>
                  ))}
                </div>
                {/* Grid rows */}
                {grid.map((row, dayIdx) => (
                  <div key={dayIdx} className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] text-white/30 font-medium w-8 text-right shrink-0">{DAY_LABELS[dayIdx]}</span>
                    <div className="flex flex-1 gap-[2px]">
                      {row.map((val, hourIdx) => (
                        <div
                          key={hourIdx}
                          className={`flex-1 min-w-[20px] h-5 rounded-sm ${getHeatmapColor(val)} transition-colors group relative`}
                          title={`${DAY_LABELS[dayIdx]} ${hourIdx}:00 - ${val}%`}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black/80 rounded text-[9px] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {val}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 pl-10">
                  <span className="text-[10px] text-white/20">Low</span>
                  <div className="flex gap-[2px]">
                    {['bg-white/[0.03]', 'bg-red-500/30', 'bg-amber-500/25', 'bg-cyan-500/20', 'bg-emerald-500/30', 'bg-emerald-500/50'].map((c, i) => (
                      <div key={i} className={`w-4 h-3 rounded-sm ${c}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-white/20">High</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Apps */}
          {apps.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Top Applications</h3>
              <div className="space-y-3">
                {apps.map((app, i) => {
                  const maxDuration = apps[0]?.totalDuration || 1;
                  const pct = maxDuration > 0 ? (app.totalDuration / maxDuration) * 100 : 0;
                  return (
                    <div key={app.appName || app._id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[11px] font-bold w-5 text-right ${i === 0 ? 'text-emerald-400' : 'text-white/25'}`}>
                            #{i + 1}
                          </span>
                          <span className="text-[13px] text-white/80 font-medium truncate">{app.appName || app._id}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-white/25">{app.sessionCount} sessions</span>
                          <span className="text-[12px] text-cyan-400 font-semibold">{formatDuration(app.totalDuration)}</span>
                          <span className="text-[11px] text-white/25">{app.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden ml-7">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            i === 0
                              ? 'bg-gradient-to-r from-emerald-500/60 to-emerald-400/40'
                              : 'bg-gradient-to-r from-cyan-500/60 to-cyan-400/40'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {topApps?.summary && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-4">
                  <span className="text-[11px] text-white/25">{topApps.summary.totalAppsTracked} apps tracked</span>
                  <span className="text-[11px] text-white/25">Total: {formatDuration(topApps.summary.totalDuration)}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductivityPulseTab;
