import { useState, useEffect, useCallback } from 'react';
import useReports from '../../hooks/useReports';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const getDefaultDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
};

const AppUsageTab = () => {
  const { appUsage, appUsageLoading, loadAppUsage } = useReports();

  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const loadData = useCallback(() => {
    loadAppUsage({ startDate: dateRange.startDate, endDate: dateRange.endDate });
  }, [dateRange, loadAppUsage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const apps = appUsage?.apps || [];
  const perUser = appUsage?.perUser || [];
  const summary = appUsage?.summary;
  const maxDuration = apps.length > 0 ? apps[0].totalDuration : 1;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
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

      {appUsageLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      ) : !appUsage ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <p className="text-[14px] font-medium">No app usage data available</p>
          <p className="text-[12px] text-white/20 mt-1">App tracking requires the desktop agent</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-center">
              <p className="text-[11px] text-white/30 font-medium mb-1">Apps Tracked</p>
              <p className="text-[20px] font-bold text-cyan-400">{summary?.totalAppsTracked || 0}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-center">
              <p className="text-[11px] text-white/30 font-medium mb-1">Total Tracked Time</p>
              <p className="text-[20px] font-bold text-purple-400">{formatDuration(summary?.totalDuration || 0)}</p>
            </div>
          </div>

          {/* App Ranking */}
          {apps.length > 0 ? (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Top Applications</h3>
              <div className="space-y-2">
                {apps.map((app, i) => {
                  const pct = maxDuration > 0 ? (app.totalDuration / maxDuration) * 100 : 0;
                  return (
                    <div key={app.appName} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl transition-all">
                      <span className={`text-[12px] font-bold w-6 text-center shrink-0 ${i < 3 ? 'text-cyan-400' : 'text-white/25'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] text-white/80 font-medium truncate">{app.appName}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[12px] text-cyan-400 font-semibold">{formatDuration(app.totalDuration)}</span>
                            <span className="text-[11px] text-white/25">{app.percentage}%</span>
                          </div>
                        </div>
                        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500/50 to-purple-500/30 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-white/20">{app.sessionCount} sessions</span>
                          <span className="text-[10px] text-white/20">{app.uniqueUsers} {app.uniqueUsers === 1 ? 'user' : 'users'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/25">
              <p className="text-[13px]">No app usage data for the selected range</p>
            </div>
          )}

          {/* Per-User Top App */}
          {perUser.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Top App per Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {perUser.map((u) => (
                  <div key={u.userId} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-[11px] font-bold text-white/60 shrink-0">
                      {(u.name || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white/80 font-medium truncate">{u.name}</p>
                      <p className="text-[11px] text-white/30 truncate">{u.topApp} - {formatDuration(u.topAppDuration)}</p>
                    </div>
                    <span className="text-[11px] text-white/20 shrink-0">{formatDuration(u.totalAppTime)} total</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppUsageTab;
