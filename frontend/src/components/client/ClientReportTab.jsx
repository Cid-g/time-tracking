import { useState, useEffect, useCallback } from 'react';
import useClient from '../../hooks/useClient';

const GROUP_BY_OPTIONS = [
  { key: 'member', label: 'Member' },
  { key: 'task', label: 'Task' },
  { key: 'day', label: 'Day' },
];

const formatHours = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
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

const ClientReportTab = ({ preselectedProjectId }) => {
  const { projects, projectsLoading, loadProjects, report, reportLoading, loadReport, exportReport } = useClient();
  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId || '');
  const [groupBy, setGroupBy] = useState('member');
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [page, setPage] = useState(1);

  // Load projects list if not already loaded
  useEffect(() => {
    if (projects.length === 0 && !projectsLoading) {
      loadProjects({ limit: 50 });
    }
  }, [projects.length, projectsLoading, loadProjects]);

  // Set preselected project
  useEffect(() => {
    if (preselectedProjectId) {
      setSelectedProjectId(preselectedProjectId);
    }
  }, [preselectedProjectId]);

  const fetchReport = useCallback(() => {
    if (!selectedProjectId) return;
    loadReport(selectedProjectId, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
      page,
      limit: 50,
    });
  }, [selectedProjectId, dateRange, groupBy, page, loadReport]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    if (!selectedProjectId) return;
    exportReport(selectedProjectId, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy,
    });
  };

  const maxGroupedSeconds = report?.grouped?.length > 0
    ? Math.max(...report.grouped.map((g) => g.totalSeconds))
    : 1;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          {/* Project selector */}
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-white/35 font-medium">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setPage(1); }}
              className="px-3 py-2 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all cursor-pointer min-w-[200px]"
            >
              <option value="" className="bg-[#1a1a2e]">Select a project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id} className="bg-[#1a1a2e]">{p.name}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
            <label className="text-[12px] text-white/35 font-medium">From</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => { setDateRange((prev) => ({ ...prev, startDate: e.target.value })); setPage(1); }}
              className="bg-transparent text-[13px] text-white border-none outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
            <label className="text-[12px] text-white/35 font-medium">To</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => { setDateRange((prev) => ({ ...prev, endDate: e.target.value })); setPage(1); }}
              className="bg-transparent text-[13px] text-white border-none outline-none cursor-pointer"
            />
          </div>

          {/* Group by pills */}
          <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
            {GROUP_BY_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setGroupBy(opt.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer ${
                  groupBy === opt.key
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!selectedProjectId}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* No project selected */}
      {!selectedProjectId && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-white/15">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-[15px] font-medium">Select a project to view reports</p>
        </div>
      )}

      {/* Loading */}
      {selectedProjectId && reportLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Report Content */}
      {selectedProjectId && !reportLoading && report && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-4 text-center">
              <p className="text-2xl font-bold text-cyan-400">{report.summary?.hoursTracked || 0}h</p>
              <p className="text-[11px] text-white/30 mt-1">Total Hours</p>
            </div>
            <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{report.summary?.billableHours || 0}h</p>
              <p className="text-[11px] text-white/30 mt-1">Billable Hours</p>
            </div>
            <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{report.summary?.entryCount || 0}</p>
              <p className="text-[11px] text-white/30 mt-1">Time Entries</p>
            </div>
          </div>

          {/* Grouped Data */}
          {report.grouped?.length > 0 && (
            <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">
                {groupBy === 'member' ? 'Hours by Member' : groupBy === 'task' ? 'Hours by Task' : 'Daily Breakdown'}
              </h3>

              {groupBy === 'day' ? (
                /* Bar chart for daily */
                <div className="flex items-end gap-1 h-32">
                  {report.grouped.map((d) => (
                    <div
                      key={d.date}
                      className="flex-1 bg-emerald-400/60 rounded-t-sm hover:bg-emerald-400 transition-colors min-w-[6px]"
                      style={{ height: `${Math.max(4, (d.totalSeconds / maxGroupedSeconds) * 100)}%` }}
                      title={`${d.date}: ${formatHours(d.totalSeconds)}`}
                    />
                  ))}
                </div>
              ) : (
                /* Progress bars for member/task */
                <div className="space-y-3">
                  {report.grouped.map((item, idx) => {
                    const pct = Math.round((item.totalSeconds / maxGroupedSeconds) * 100);
                    const label = groupBy === 'member'
                      ? `${item.firstName} ${item.lastName}`
                      : item.title || 'No Task';
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between text-[12px] mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-white/60 truncate">{label}</span>
                            {groupBy === 'task' && item.status && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                item.status === 'in_progress' ? 'bg-cyan-500/10 text-cyan-400' :
                                item.status === 'in_review' ? 'bg-purple-500/10 text-purple-400' :
                                'bg-white/[0.06] text-white/40'
                              }`}>
                                {item.status}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-cyan-400 font-medium">{formatHours(item.totalSeconds)}</span>
                            <span className="text-white/25">{item.entryCount} entries</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-400/60 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Raw Entries Table */}
          {report.entries?.length > 0 && (
            <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-[14px] font-semibold text-white">Time Entries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] text-white/30 uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-medium">Date</th>
                      <th className="text-left px-5 py-3 font-medium">Member</th>
                      <th className="text-left px-5 py-3 font-medium">Task</th>
                      <th className="text-left px-5 py-3 font-medium">Description</th>
                      <th className="text-right px-5 py-3 font-medium">Duration</th>
                      <th className="text-center px-5 py-3 font-medium">Billable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.entries.map((entry) => (
                      <tr
                        key={entry._id}
                        className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 text-[12px] text-white/50">
                          {new Date(entry.startTime).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-[12px] text-white/60">
                          {entry.user?.firstName} {entry.user?.lastName}
                        </td>
                        <td className="px-5 py-3 text-[12px] text-white/50 max-w-[150px] truncate">
                          {entry.task?.title || '-'}
                        </td>
                        <td className="px-5 py-3 text-[12px] text-white/35 max-w-[200px] truncate">
                          {entry.description || '-'}
                        </td>
                        <td className="px-5 py-3 text-[12px] text-cyan-400 font-medium text-right">
                          {formatHours(entry.duration - entry.totalBreakDuration)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {entry.isBillable ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Yes</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 font-medium">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {report.pagination?.pages > 1 && (
                <div className="flex items-center justify-center gap-1 p-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="w-8 h-8 rounded-lg text-[12px] font-medium text-white/40 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    &lt;
                  </button>
                  <span className="text-[12px] text-white/35 px-3">
                    Page {report.pagination.page} of {report.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(report.pagination.pages, p + 1))}
                    disabled={page >= report.pagination.pages}
                    className="w-8 h-8 rounded-lg text-[12px] font-medium text-white/40 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty report */}
          {report.entries?.length === 0 && report.grouped?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-white/30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-white/15">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p className="text-[15px] font-medium">No time entries for this period</p>
              <p className="text-[13px] text-white/20 mt-1">Try adjusting the date range</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientReportTab;
