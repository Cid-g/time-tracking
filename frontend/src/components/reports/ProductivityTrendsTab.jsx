import { useState, useEffect, useCallback } from 'react';
import useReports from '../../hooks/useReports';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
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

const ProductivityTrendsTab = () => {
  const { productivityTrends, productivityLoading, loadProductivityTrends, exportProductivity } = useReports();

  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [groupBy, setGroupBy] = useState('user');
  const [hourlyRate, setHourlyRate] = useState(0);

  const loadData = useCallback(() => {
    loadProductivityTrends({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
      hourlyRate,
    });
  }, [dateRange, groupBy, hourlyRate, loadProductivityTrends]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = () => {
    exportProductivity({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
      hourlyRate,
      format: 'csv',
    });
  };

  const summary = productivityTrends?.summary;
  const trends = productivityTrends?.trends || [];
  const overtime = productivityTrends?.overtime || [];
  const maxDuration = trends.length > 0 ? Math.max(...trends.map((t) => t.totalDuration)) : 1;

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
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-[13px] text-white outline-none cursor-pointer"
        >
          <option value="user">Group by User</option>
          <option value="project">Group by Project</option>
          <option value="day">Group by Day</option>
        </select>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
          <label className="text-[12px] text-white/35 font-medium">$/hr</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
            className="bg-transparent text-[13px] text-white border-none outline-none w-16"
            placeholder="0.00"
          />
        </div>
        <button
          onClick={handleExport}
          className="ml-auto px-4 py-2.5 text-[12px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all cursor-pointer disabled:opacity-40"
          disabled={productivityLoading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1.5 -mt-0.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* Loading */}
      {productivityLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : !productivityTrends ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <p className="text-[14px] font-medium">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Hours', value: `${summary?.totalHours || 0}h`, color: 'cyan' },
              { label: 'Billable Hours', value: `${summary?.totalBillableHours || 0}h`, color: 'emerald' },
              { label: 'Avg Daily', value: `${summary?.avgDailyHours || 0}h`, color: 'purple' },
              { label: 'Overtime', value: summary?.overtimeIncidents || 0, color: 'amber' },
            ].map((card) => (
              <div key={card.label} className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-center">
                <p className="text-[11px] text-white/30 font-medium mb-1">{card.label}</p>
                <p className={`text-[20px] font-bold text-${card.color}-400`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Cost Analysis */}
          {summary?.estimatedCost !== null && summary?.estimatedCost !== undefined && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[12px] text-emerald-400/60 font-medium">Estimated Cost (${hourlyRate}/hr)</p>
                <p className="text-[22px] font-bold text-emerald-400 mt-0.5">${summary.estimatedCost.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/25">{summary.totalBillableHours}h billable</p>
                <p className="text-[11px] text-white/25">{summary.totalEntries} entries</p>
              </div>
            </div>
          )}

          {/* Trend Bar Chart */}
          {trends.length > 0 ? (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">
                Hours by {groupBy === 'user' ? 'Member' : groupBy === 'project' ? 'Project' : 'Day'}
              </h3>
              <div className="space-y-3">
                {trends.slice(0, 20).map((item, i) => {
                  const pct = maxDuration > 0 ? (item.totalDuration / maxDuration) * 100 : 0;
                  const hours = (item.totalDuration / 3600).toFixed(1);
                  const billableHours = (item.billableSeconds / 3600).toFixed(1);
                  return (
                    <div key={item._id || i} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.color && (
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          )}
                          <span className="text-[13px] text-white/80 font-medium truncate">
                            {item.name || item.date || 'Unknown'}
                          </span>
                          {item.email && (
                            <span className="text-[11px] text-white/25 truncate hidden md:inline">{item.email}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[12px] text-cyan-400 font-semibold">{hours}h</span>
                          <span className="text-[10px] text-white/25">{billableHours}h billable</span>
                          <span className="text-[10px] text-white/20">{item.daysWorked}d</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/40 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/25">
              <p className="text-[13px]">No data for the selected range</p>
            </div>
          )}

          {/* Overtime Alerts */}
          {overtime.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-amber-400 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Overtime Alerts ({overtime.length})
              </h3>
              <div className="space-y-2">
                {overtime.slice(0, 15).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-white/50 font-mono">{item.date}</span>
                      <span className="text-[13px] text-white/80 font-medium">{item.userName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-white/40">{formatDuration(item.dailyTotal)} total</span>
                      <span className="text-[12px] text-amber-400 font-semibold">+{formatDuration(item.overtimeSeconds)} OT</span>
                    </div>
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

export default ProductivityTrendsTab;
