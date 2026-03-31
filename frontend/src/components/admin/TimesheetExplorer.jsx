import { useState, useEffect, useCallback } from 'react';
import useAdmin from '../../hooks/useAdmin';
import AdminEditEntryModal from './AdminEditEntryModal';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  running: { label: 'Running', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  paused: { label: 'Paused', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' },
  completed: { label: 'Completed', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-400' },
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const TimesheetExplorer = () => {
  const {
    timesheets,
    timesheetPagination,
    timesheetsLoading,
    complianceResults,
    complianceLoading,
    loadTimesheets,
    editTimeEntry,
    exportTimesheets,
    runCompliance,
    bulkTimesheetAction,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showCompliance, setShowCompliance] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTimesheets = useCallback(
    (page = 1) => {
      const params = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      loadTimesheets(params);
    },
    [search, statusFilter, startDate, endDate, loadTimesheets]
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchTimesheets(), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, startDate, endDate]);

  const handleSelectAll = () => {
    if (selectedIds.length === timesheets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(timesheets.map((e) => e._id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkFlag = async (action) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await bulkTimesheetAction({
        action,
        entryIds: selectedIds,
        reason: `Bulk ${action} by admin`,
      });
      setSelectedIds([]);
      fetchTimesheets(timesheetPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} entries`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error('Select a date range to export');
      return;
    }
    await exportTimesheets({ startDate, endDate, format: 'csv' });
  };

  const handleRunCompliance = async () => {
    if (!startDate || !endDate) {
      toast.error('Select a date range for compliance check');
      return;
    }
    await runCompliance({ startDate, endDate });
    setShowCompliance(true);
  };

  const handleEditSave = async (updates, reason) => {
    try {
      await editTimeEntry(editingEntry._id, updates, reason);
      setEditingEntry(null);
      fetchTimesheets(timesheetPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update entry');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-cyan-500/30 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white/70 outline-none cursor-pointer appearance-none min-w-[120px]"
        >
          <option value="">All Status</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white/70 outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white/70 outline-none"
        />

        <button
          onClick={handleExport}
          className="px-3 py-2 text-[12px] font-medium text-white/50 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
        >
          Export CSV
        </button>

        <button
          onClick={handleRunCompliance}
          disabled={complianceLoading}
          className="px-3 py-2 text-[12px] font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-40"
        >
          {complianceLoading ? 'Checking...' : 'Compliance Check'}
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
          <span className="text-[12px] text-cyan-400 font-medium">{selectedIds.length} selected</span>
          <button
            onClick={() => handleBulkFlag('flag')}
            disabled={actionLoading}
            className="px-3 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-40"
          >
            Flag
          </button>
          <button
            onClick={() => handleBulkFlag('unflag')}
            disabled={actionLoading}
            className="px-3 py-1 text-[11px] font-medium text-white/50 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all cursor-pointer disabled:opacity-40"
          >
            Unflag
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1 text-[11px] font-medium text-white/30 hover:text-white/50 transition-all cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Compliance Results */}
      {showCompliance && complianceResults && (
        <div className="mb-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-white/80">Compliance Results</h3>
            <button onClick={() => setShowCompliance(false)} className="text-white/25 hover:text-white/50 cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Total Violations</p>
              <p className="text-xl font-bold text-red-400">{complianceResults.summary.totalViolations}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Overtime</p>
              <p className="text-xl font-bold text-amber-400">{complianceResults.summary.overtimeCount}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Weekend Work</p>
              <p className="text-xl font-bold text-purple-400">{complianceResults.summary.weekendCount}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Users Affected</p>
              <p className="text-xl font-bold text-cyan-400">{complianceResults.summary.usersAffected}</p>
            </div>
          </div>

          {complianceResults.violations.length > 0 && (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {complianceResults.violations.slice(0, 20).map((v, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg text-[12px]">
                  <span className="text-white/60 font-medium">{v.userName}</span>
                  <span className="text-white/30">{v.date}</span>
                  <span className="text-cyan-400/70">{formatDuration(v.totalDuration)}</span>
                  {v.isOvertime && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">OVERTIME</span>
                  )}
                  {v.isWeekend && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">WEEKEND</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {timesheetsLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      ) : timesheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 text-white/15">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p className="text-[14px] font-medium">No time entries found</p>
          <p className="text-[12px] text-white/20 mt-1">Adjust your filters to see results</p>
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[32px_1fr_120px_100px_130px_80px_80px_60px] gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/25 mb-1">
            <span>
              <input
                type="checkbox"
                checked={selectedIds.length === timesheets.length && timesheets.length > 0}
                onChange={handleSelectAll}
                className="accent-cyan-500 cursor-pointer"
              />
            </span>
            <span>User</span>
            <span>Date</span>
            <span>Hours</span>
            <span>Project</span>
            <span>Status</span>
            <span>Tags</span>
            <span />
          </div>

          {/* Rows */}
          <div className="space-y-1.5">
            {timesheets.map((entry) => {
              const statusStyle = STATUS_CONFIG[entry.status] || STATUS_CONFIG.completed;
              const initials = `${entry.user?.firstName?.[0] || ''}${entry.user?.lastName?.[0] || ''}`.toUpperCase();
              const isFlagged = entry.tags?.includes('flagged');

              return (
                <div
                  key={entry._id}
                  className={`grid grid-cols-1 md:grid-cols-[32px_1fr_120px_100px_130px_80px_80px_60px] gap-3 items-center px-4 py-3 rounded-xl border transition-all ${
                    isFlagged
                      ? 'bg-amber-500/[0.04] border-amber-500/10'
                      : 'bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Checkbox */}
                  <span>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(entry._id)}
                      onChange={() => handleSelect(entry._id)}
                      className="accent-cyan-500 cursor-pointer"
                    />
                  </span>

                  {/* User */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/70 to-purple-500/70 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-white/70 truncate">
                        {entry.user?.firstName} {entry.user?.lastName}
                      </p>
                      <p className="text-[11px] text-white/25 truncate">{entry.description || 'No description'}</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-[12px] text-white/50">{formatDate(entry.startTime)}</p>
                    <p className="text-[10px] text-white/25">{formatTime(entry.startTime)} – {formatTime(entry.endTime)}</p>
                  </div>

                  {/* Hours */}
                  <span className="text-[12px] text-cyan-400/70 font-medium">{formatDuration(entry.duration)}</span>

                  {/* Project */}
                  <div className="flex items-center gap-1.5">
                    {entry.project && (
                      <>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.project.color || '#06b6d4' }}
                        />
                        <span className="text-[12px] text-white/50 truncate">{entry.project.name}</span>
                      </>
                    )}
                    {!entry.project && <span className="text-[12px] text-white/20">No project</span>}
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border w-fit ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {statusStyle.label}
                  </span>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {isFlagged && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">FLAGGED</span>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => setEditingEntry(entry)}
                    className="text-white/25 hover:text-cyan-400 transition-all cursor-pointer"
                    title="Edit entry"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {timesheetPagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[...Array(Math.min(timesheetPagination.pages, 10))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchTimesheets(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                    timesheetPagination.page === i + 1
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                      : 'text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <AdminEditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default TimesheetExplorer;
