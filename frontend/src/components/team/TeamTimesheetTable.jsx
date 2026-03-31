import { useState } from 'react';

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: 'bg-white/[0.06]', text: 'text-white/50', border: 'border-white/[0.08]', dot: 'bg-white/30' },
  submitted: { label: 'Submitted', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-400' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPeriod = (period) => {
  if (!period?.startDate || !period?.endDate) return '—';
  return `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`;
};

const TeamTimesheetTable = ({
  submissions = [],
  pagination,
  onPageChange,
  loading,
  onApprove,
  onReject,
  actionLoading,
}) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white/[0.04] rounded-xl h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-white/15">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <p className="text-[14px] font-medium">No timesheets found</p>
        <p className="text-[12px] text-white/20 mt-1">Adjust your filters to see results</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[1fr_140px_90px_80px_100px_140px] gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/25 mb-1">
        <span>Member</span>
        <span>Period</span>
        <span>Hours</span>
        <span>Entries</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {submissions.map((sub) => {
          const statusStyle = STATUS_CONFIG[sub.status] || STATUS_CONFIG.draft;
          const initials = `${sub.user?.firstName?.[0] || ''}${sub.user?.lastName?.[0] || ''}`.toUpperCase();

          return (
            <div
              key={sub._id}
              className="grid grid-cols-1 md:grid-cols-[1fr_140px_90px_80px_100px_140px] gap-3 items-center px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:bg-white/[0.05] transition-all"
            >
              {/* Member */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/70 to-purple-500/70 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/70 truncate">
                    {sub.user?.firstName} {sub.user?.lastName}
                  </p>
                  <p className="text-[11px] text-white/25 truncate">{sub.user?.email}</p>
                </div>
              </div>

              {/* Period */}
              <span className="text-[12px] text-white/50">{formatPeriod(sub.period)}</span>

              {/* Hours */}
              <span className="text-[12px] text-cyan-400/70 font-medium">
                {formatDuration(sub.totalDuration)}
              </span>

              {/* Entries */}
              <span className="text-[12px] text-white/40">{sub.entryCount || 0}</span>

              {/* Status */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border w-fit ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {statusStyle.label}
              </span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5">
                {sub.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => onApprove(sub._id)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 rounded-lg border border-emerald-500/20 transition-all cursor-pointer disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(sub)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/15 rounded-lg border border-red-500/20 transition-all cursor-pointer disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </>
                )}
                {sub.status === 'approved' && sub.reviewedBy && (
                  <span className="text-[11px] text-white/25">
                    by {sub.reviewedBy.firstName} {sub.reviewedBy.lastName}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                pagination.page === i + 1
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-white/40 hover:bg-white/[0.06]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamTimesheetTable;
