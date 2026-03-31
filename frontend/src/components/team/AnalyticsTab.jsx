import { useState, useEffect, useCallback } from 'react';
import useTeam from '../../hooks/useTeam';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const getDefaultDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date();
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const AnalyticsTab = () => {
  const {
    analytics,
    analyticsLoading,
    loadHoursBreakdown,
    loadProjectDistribution,
    loadWeeklyTrends,
  } = useTeam();

  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const loadAll = useCallback(() => {
    const params = { startDate: dateRange.startDate, endDate: dateRange.endDate };
    loadHoursBreakdown(params);
    loadProjectDistribution(params);
    loadWeeklyTrends();
  }, [dateRange, loadHoursBreakdown, loadProjectDistribution, loadWeeklyTrends]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const { hoursBreakdown, projectDistribution, weeklyTrends } = analytics;

  const maxHours = hoursBreakdown.length > 0
    ? Math.max(...hoursBreakdown.map((m) => m.totalSeconds))
    : 1;

  const maxProjectHours = projectDistribution.length > 0
    ? Math.max(...projectDistribution.map((p) => p.totalSeconds))
    : 1;

  const totalProjectSeconds = projectDistribution.reduce((s, p) => s + p.totalSeconds, 0);

  const maxTrendSeconds = weeklyTrends.length > 0
    ? Math.max(...weeklyTrends.map((t) => t.totalSeconds))
    : 1;

  // Trend comparison stats
  const currentWeek = weeklyTrends.length > 0 ? weeklyTrends[weeklyTrends.length - 1] : null;
  const lastWeek = weeklyTrends.length > 1 ? weeklyTrends[weeklyTrends.length - 2] : null;
  const fourWeekAvg = weeklyTrends.length > 0
    ? Math.round(weeklyTrends.reduce((s, t) => s + t.totalSeconds, 0) / weeklyTrends.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
          <label className="text-[12px] text-white/35 font-medium">From</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
            className="bg-transparent text-[13px] text-white border-none outline-none cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
          <label className="text-[12px] text-white/35 font-medium">To</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
            className="bg-transparent text-[13px] text-white border-none outline-none cursor-pointer"
          />
        </div>
      </div>

      {analyticsLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Weekly Trends */}
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
            <h3 className="text-[14px] font-semibold text-white mb-4">Weekly Trends</h3>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'This Week', value: formatDuration(currentWeek?.totalSeconds || 0), sub: `${currentWeek?.activeMemberCount || 0} active`, color: 'cyan' },
                { label: 'Last Week', value: formatDuration(lastWeek?.totalSeconds || 0), sub: `${lastWeek?.activeMemberCount || 0} active`, color: 'purple' },
                { label: `${weeklyTrends.length}-Week Avg`, value: formatDuration(fourWeekAvg), sub: 'per week', color: 'emerald' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-3 text-center">
                  <p className="text-[11px] text-white/30 font-medium mb-1">{s.label}</p>
                  <p className={`text-[17px] font-bold text-${s.color}-400`}>{s.value}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            {weeklyTrends.length > 0 ? (
              <div className="flex items-end gap-1.5 h-32">
                {weeklyTrends.map((trend, i) => {
                  const heightPct = maxTrendSeconds > 0 ? (trend.totalSeconds / maxTrendSeconds) * 100 : 0;
                  const isLast = i === weeklyTrends.length - 1;
                  return (
                    <div key={`${trend.year}-${trend.week}`} className="flex-1 flex flex-col items-center gap-1 group" title={`W${trend.week} ${trend.year}: ${formatDuration(trend.totalSeconds)}`}>
                      <span className="text-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatDuration(trend.totalSeconds)}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isLast ? 'bg-cyan-500/60' : 'bg-white/[0.1]'
                        } hover:bg-cyan-500/40`}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="text-[9px] text-white/20 font-medium">W{trend.week}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-white/25 text-center py-8">No trend data available</p>
            )}
          </div>

          {/* Hours Breakdown by Member */}
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
            <h3 className="text-[14px] font-semibold text-white mb-4">
              Hours by Member
              <span className="text-[12px] text-white/25 font-normal ml-2">
                {hoursBreakdown.length} member{hoursBreakdown.length !== 1 ? 's' : ''}
              </span>
            </h3>

            {hoursBreakdown.length > 0 ? (
              <div className="space-y-2">
                {hoursBreakdown.map((member, i) => {
                  const pct = maxHours > 0 ? (member.totalSeconds / maxHours) * 100 : 0;
                  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
                  return (
                    <div key={member.userId} className="flex items-center gap-3">
                      <span className="text-[11px] text-white/20 font-medium w-5 text-right shrink-0">
                        {i + 1}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/60 to-purple-500/60 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-white/60 font-medium truncate">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-[12px] text-cyan-400/70 font-medium shrink-0 ml-2">
                            {formatDuration(member.totalSeconds)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/40 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] text-white/20 shrink-0 w-12 text-right">
                        {member.entryCount} entries
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-white/25 text-center py-8">No data for selected period</p>
            )}
          </div>

          {/* Project Distribution */}
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
            <h3 className="text-[14px] font-semibold text-white mb-4">
              Hours by Project
              <span className="text-[12px] text-white/25 font-normal ml-2">
                {formatDuration(totalProjectSeconds)} total
              </span>
            </h3>

            {projectDistribution.length > 0 ? (
              <div className="space-y-2.5">
                {projectDistribution.map((project) => {
                  const pct = maxProjectHours > 0 ? (project.totalSeconds / maxProjectHours) * 100 : 0;
                  const sharePct = totalProjectSeconds > 0
                    ? Math.round((project.totalSeconds / totalProjectSeconds) * 100)
                    : 0;
                  return (
                    <div key={project.projectId || 'none'} className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] text-white/60 font-medium truncate">
                            {project.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[11px] text-white/25">{sharePct}%</span>
                            <span className="text-[12px] text-cyan-400/70 font-medium">
                              {formatDuration(project.totalSeconds)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: project.color || '#06b6d4',
                              opacity: 0.6,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] text-white/20 shrink-0 w-16 text-right">
                        {project.memberCount} member{project.memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-white/25 text-center py-8">No data for selected period</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
