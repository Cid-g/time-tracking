import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { listTimeEntriesApi, deleteTimeEntryApi } from '../../api/timeEntry.api';
import ConfirmModal from '../common/ConfirmModal';
import EditEntryModal from './EditEntryModal';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  return `${mins}m`;
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const groupByDate = (entries) => {
  const groups = {};
  entries.forEach((entry) => {
    const dateKey = new Date(entry.startTime).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
};

const TimeEntriesList = ({ refreshKey }) => {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const fetchEntries = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await listTimeEntriesApi({ page, limit: 20 });
      setEntries(data.data.entries);
      setPagination(data.data.pagination);
    } catch {
      toast.error('Failed to load time entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, refreshKey]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deletingId) return;
    setDeletingId(deleteTarget._id);
    try {
      await deleteTimeEntryApi(deleteTarget._id);
      toast.success('Entry deleted');
      setDeleteTarget(null);
      fetchEntries(pagination.page);
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = groupByDate(entries);

  return (
    <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">Time Entries</h3>
        <span className="text-[13px] text-white/30 font-medium">{pagination.total} entries</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_10px_rgba(6,182,212,0.2)]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <svg className="text-white/10 mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p className="text-[15px] font-medium text-white/50 mb-1">No time entries yet</p>
          <span className="text-[13px] text-white/30">Start a timer or add a manual entry to get started.</span>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {grouped.map(([dateKey, dayEntries]) => {
            const dayTotal = dayEntries.reduce(
              (sum, e) => sum + Math.max(0, (e.duration || 0) - (e.totalBreakDuration || 0)),
              0
            );

            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="px-6 py-3 bg-white/[0.03] flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-white/60">{formatDate(dateKey)}</span>
                  <span className="text-[13px] font-semibold text-white">{formatDuration(dayTotal)}</span>
                </div>

                {/* Entries for this date */}
                {dayEntries.map((entry) => {
                  const netDuration = Math.max(0, (entry.duration || 0) - (entry.totalBreakDuration || 0));

                  return (
                    <div
                      key={entry._id}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.03] transition-colors duration-100 group cursor-pointer"
                      onClick={() => setEditTarget(entry)}
                    >
                      {/* Entry type indicator */}
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 border ${
                        entry.entryType === 'timer'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/15'
                      }`}>
                        {entry.entryType === 'timer' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        )}
                      </div>

                      {/* Description & time range */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-white/80 truncate">
                          {entry.description || 'No description'}
                        </p>
                        <p className="text-[12px] text-white/30 mt-0.5">
                          {formatTime(entry.startTime)} — {formatTime(entry.endTime)}
                          {entry.totalBreakDuration > 0 && (
                            <span className="ml-2 text-amber-400/70">
                              ({formatDuration(entry.totalBreakDuration)} break)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Billable badge */}
                      {entry.isBillable && (
                        <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold rounded-md border border-emerald-500/15">
                          $
                        </span>
                      )}

                      {/* Duration */}
                      <span className="text-[14px] font-semibold text-white tabular-nums w-20 text-right">
                        {formatDuration(netDuration)}
                      </span>

                      {/* Edit button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTarget(entry); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all duration-150 cursor-pointer"
                        title="Edit entry"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry); }}
                        disabled={deletingId === entry._id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 cursor-pointer disabled:opacity-50"
                        title="Delete entry"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={() => fetchEntries(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 text-[13px] font-medium text-white/60 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg border border-white/[0.08] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span className="text-[13px] text-white/30">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchEntries(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-1.5 text-[13px] font-medium text-white/60 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg border border-white/[0.08] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Time Entry"
        message={`Are you sure you want to delete "${deleteTarget?.description || 'this entry'}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={!!deletingId}
      />

      {/* Edit entry modal */}
      <EditEntryModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        entry={editTarget}
        onEntryUpdated={() => fetchEntries(pagination.page)}
      />
    </div>
  );
};

export default TimeEntriesList;
