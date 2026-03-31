import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const formatHours = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-white/[0.06]', text: 'text-white/50', border: 'border-white/[0.08]' },
  submitted: { label: 'Submitted', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  under_review: { label: 'Under Review', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

const ACTION_CONFIG = {
  submitted: { icon: '→', color: 'text-amber-400', label: 'Submitted' },
  approved: { icon: '✓', color: 'text-emerald-400', label: 'Approved' },
  rejected: { icon: '✕', color: 'text-red-400', label: 'Rejected' },
};

const SubmissionDetailModal = ({
  isOpen,
  onClose,
  submission,
  getSubmission,
  isManagerOrAdmin = false,
  onApprove,
  onReject,
}) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!submission?._id) return;
    setLoading(true);
    try {
      const data = await getSubmission(submission._id);
      setDetail(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [submission?._id, getSubmission]);

  useEffect(() => {
    if (isOpen && submission) loadDetail();
    if (!isOpen) setDetail(null);
  }, [isOpen, submission, loadDetail]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const s = detail || submission;
  const status = STATUS_CONFIG[s?.status] || STATUS_CONFIG.draft;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove?.(s._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  // Group entries by date
  const entries = detail?.entries || [];
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
              <div className="flex items-center gap-3">
                <h2 className="text-[18px] font-bold text-white">Submission Details</h2>
                <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                  {status.label}
                </span>
              </div>
              {s && (
                <p className="text-[13px] text-white/40 mt-0.5">
                  {formatDate(s.period?.startDate)} — {formatDate(s.period?.endDate)}
                  {s.user?.firstName && ` by ${s.user.firstName} ${s.user.lastName}`}
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 text-white/30 hover:text-white/60 hover:bg-white/[0.06] rounded-lg transition-all cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-center">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-1">Total Hours</p>
                  <p className="text-[20px] font-bold text-white">{formatHours(s?.totalDuration || 0)}</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-center">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-1">Billable</p>
                  <p className="text-[20px] font-bold text-emerald-400">{formatHours(s?.totalBillable || 0)}</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-center">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-1">Entries</p>
                  <p className="text-[20px] font-bold text-cyan-400">{s?.entryCount || 0}</p>
                </div>
              </div>

              {/* Notes */}
              {s?.notes && (
                <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 mb-5">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-1.5">Notes</p>
                  <p className="text-[13px] text-white/50 italic">"{s.notes}"</p>
                </div>
              )}

              {/* Approval chain */}
              {s?.approvalChain?.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-2 px-1">Approval History</p>
                  <div className="flex flex-col gap-2">
                    {s.approvalChain.map((action, idx) => {
                      const config = ACTION_CONFIG[action.action] || ACTION_CONFIG.submitted;
                      return (
                        <div key={idx} className="flex items-start gap-3 bg-white/[0.03] rounded-xl border border-white/[0.06] px-4 py-3">
                          <span className={`text-[16px] ${config.color} shrink-0 mt-0.5`}>{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[13px] font-semibold ${config.color}`}>{config.label}</span>
                              <span className="text-[11px] text-white/25">
                                by {action.user?.firstName ? `${action.user.firstName} ${action.user.lastName}` : 'Unknown'}
                              </span>
                            </div>
                            {action.comment && (
                              <p className="text-[12px] text-white/40 mt-0.5">"{action.comment}"</p>
                            )}
                            <p className="text-[11px] text-white/20 mt-0.5">
                              {formatDateTime(action.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Entries by date */}
              {Object.keys(grouped).length > 0 && (
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-semibold mb-2 px-1">Time Entries</p>
                  {Object.entries(grouped).map(([dateKey, dayEntries]) => (
                    <div key={dateKey} className="mb-3">
                      <h5 className="text-[12px] font-medium text-white/25 mb-1.5 px-1">
                        {formatDate(dateKey)}
                      </h5>
                      <div className="flex flex-col gap-1">
                        {dayEntries.map((entry) => {
                          const net = entry.duration - entry.totalBreakDuration;
                          return (
                            <div
                              key={entry._id}
                              className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.05]"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] text-white/60 truncate">
                                    {entry.description || 'No description'}
                                  </span>
                                  {entry.project && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-white/30 bg-white/[0.04] rounded">
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.project.color || '#06b6d4' }} />
                                      {entry.project.name}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-white/20">
                                  {formatTime(entry.startTime)} — {formatTime(entry.endTime)}
                                </span>
                              </div>
                              <span className="text-[13px] font-medium text-white/40 shrink-0">
                                {formatHours(net)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - action buttons for managers */}
        {isManagerOrAdmin && s?.status === 'submitted' && (
          <div className="px-6 py-4 border-t border-white/[0.06] shrink-0 flex items-center justify-end gap-3">
            <button
              onClick={() => onReject?.(s)}
              disabled={actionLoading}
              className="px-5 py-2.5 text-[13px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/15 transition-all cursor-pointer disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-5 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2"
            >
              {actionLoading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetailModal;
