const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    bg: 'bg-white/[0.06]',
    text: 'text-white/50',
    border: 'border-white/[0.08]',
    dot: 'bg-white/30',
  },
  submitted: {
    label: 'Submitted',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  under_review: {
    label: 'Under Review',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    dot: 'bg-purple-400',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
  },
};

const formatHours = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const SubmissionCard = ({
  submission,
  onView,
  onSubmit,
  onDelete,
  selectable = false,
  selected = false,
  onSelect,
  showUser = false,
}) => {
  const status = STATUS_CONFIG[submission.status] || STATUS_CONFIG.draft;

  return (
    <div
      className={`bg-white/[0.05] backdrop-blur-xl rounded-2xl border overflow-hidden transition-all duration-200 group ${
        selected ? 'border-cyan-500/30 bg-cyan-500/[0.03]' : 'border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.12]'
      }`}
    >
      <div className="p-5">
        {/* Top row: select + period + status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {selectable && submission.status === 'draft' && (
              <button
                onClick={(e) => { e.stopPropagation(); onSelect?.(submission._id); }}
                className={`w-5 h-5 rounded-md border-2 transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  selected
                    ? 'bg-cyan-500 border-cyan-500'
                    : 'border-white/20 hover:border-cyan-500/50'
                }`}
              >
                {selected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )}
            <div>
              <div className="text-[15px] font-semibold text-white">
                {formatDate(submission.period.startDate)} — {formatDate(submission.period.endDate)}
              </div>
              {showUser && submission.user && (
                <p className="text-[12px] text-white/35 mt-0.5">
                  {submission.user.firstName} {submission.user.lastName}
                </p>
              )}
            </div>
          </div>
          <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 mb-3 text-[13px] text-white/45">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatHours(submission.totalDuration)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>{formatHours(submission.totalBillable)} billable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>{submission.entryCount} entries</span>
          </div>
        </div>

        {/* Project breakdown pills */}
        {submission.projectBreakdown?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {submission.projectBreakdown.map((pb, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-white/40 bg-white/[0.04] rounded-md border border-white/[0.06]"
              >
                {pb.project ? (
                  <>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: pb.project.color || '#06b6d4' }}
                    />
                    {pb.project.name}
                  </>
                ) : (
                  'No Project'
                )}
                <span className="text-white/25">({formatHours(pb.duration)})</span>
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {submission.notes && (
          <p className="text-[12px] text-white/30 mb-3 line-clamp-2 italic">"{submission.notes}"</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => onView?.(submission)}
            className="px-3 py-1.5 text-[12px] font-medium text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all cursor-pointer"
          >
            View Details
          </button>
          {submission.status === 'draft' && (
            <>
              <button
                onClick={() => onSubmit?.(submission._id)}
                className="px-3 py-1.5 text-[12px] font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg border border-cyan-500/15 transition-all cursor-pointer"
              >
                Submit
              </button>
              <button
                onClick={() => onDelete?.(submission._id)}
                className="px-3 py-1.5 text-[12px] font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer ml-auto"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionCard;
