import { useState, useEffect, useCallback } from 'react';
import { listTimeEntriesApi } from '../../api/timeEntry.api';
import toast from 'react-hot-toast';

const formatHours = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Get Monday of the current or given week
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekEnd = (weekStart) => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

const CreateSubmissionModal = ({ isOpen, onClose, onSubmit }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [entries, setEntries] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const weekStart = getWeekStart();
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = getWeekEnd(weekStart);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listTimeEntriesApi({
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        status: 'completed',
        limit: 100,
        sortBy: 'startTime',
        order: 'asc',
      });
      setEntries(data.data.entries || []);
      // Auto-select all
      setSelectedIds(new Set((data.data.entries || []).map((e) => e._id)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    if (isOpen) {
      setWeekOffset(0);
      setNotes('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchEntries();
  }, [isOpen, fetchEntries]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleEntry = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e._id)));
    }
  };

  const selectedEntries = entries.filter((e) => selectedIds.has(e._id));
  const totalDuration = selectedEntries.reduce((sum, e) => sum + (e.duration - e.totalBreakDuration), 0);
  const totalBillable = selectedEntries
    .filter((e) => e.isBillable)
    .reduce((sum, e) => sum + (e.duration - e.totalBreakDuration), 0);

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        entries: Array.from(selectedIds),
        period: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create submission');
    } finally {
      setSubmitting(false);
    }
  };

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const dateKey = new Date(entry.startTime).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-white">Create Submission</h2>
              <p className="text-[13px] text-white/40 mt-0.5">Select time entries to submit for approval</p>
            </div>
            <button onClick={onClose} className="p-2 text-white/30 hover:text-white/60 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Week navigator */}
          <div className="flex items-center justify-between mt-4 bg-white/[0.04] rounded-xl px-4 py-2.5 border border-white/[0.06]">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 text-white/40 hover:text-white/80 cursor-pointer transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-[14px] font-semibold text-white">
              {formatDate(weekStart)} — {formatDate(weekEnd)}
            </span>
            <button
              onClick={() => setWeekOffset((prev) => Math.min(prev + 1, 0))}
              disabled={weekOffset >= 0}
              className="p-1 text-white/40 hover:text-white/80 cursor-pointer transition-colors disabled:opacity-20 disabled:cursor-default"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-white/15">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-[14px] font-medium">No completed entries this week</p>
              <p className="text-[12px] text-white/20 mt-1">Track some time and come back here</p>
            </div>
          ) : (
            <>
              {/* Select all header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-[12px] font-medium text-white/40 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    selectedIds.size === entries.length ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'
                  }`}>
                    {selectedIds.size === entries.length && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {selectedIds.size === entries.length ? 'Deselect all' : 'Select all'} ({entries.length} entries)
                </button>
                <span className="text-[12px] text-white/30">{selectedIds.size} selected</span>
              </div>

              {/* Entries grouped by date */}
              {Object.entries(grouped).map(([dateKey, dayEntries]) => (
                <div key={dateKey} className="mb-4">
                  <h4 className="text-[12px] font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">
                    {formatDate(dateKey)}
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {dayEntries.map((entry) => {
                      const net = entry.duration - entry.totalBreakDuration;
                      const isSelected = selectedIds.has(entry._id);
                      return (
                        <button
                          key={entry._id}
                          onClick={() => toggleEntry(entry._id)}
                          className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/[0.06] border border-cyan-500/15'
                              : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-white/20'
                          }`}>
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] text-white/70 truncate">
                                {entry.description || 'No description'}
                              </span>
                              {entry.project && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-white/30 bg-white/[0.04] rounded">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.project.color || '#06b6d4' }} />
                                  {entry.project.name}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-white/25">
                              {formatTime(entry.startTime)} — {formatTime(entry.endTime)}
                            </span>
                          </div>
                          <span className="text-[13px] font-medium text-white/50 shrink-0">{formatHours(net)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] shrink-0">
          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for your manager (optional)"
            maxLength={500}
            rows={2}
            className="w-full px-4 py-2.5 mb-3 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all resize-none"
          />

          {/* Summary + submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[13px] text-white/40">
              <span>{formatHours(totalDuration)} total</span>
              <span>{formatHours(totalBillable)} billable</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-[13px] font-medium text-white/50 hover:text-white/80 hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedIds.size === 0}
                className="px-5 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-default shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)] flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Create Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSubmissionModal;
