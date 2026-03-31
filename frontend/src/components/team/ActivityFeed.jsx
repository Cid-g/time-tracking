const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const ActivityFeed = ({ entries = [], pagination, onPageChange, loading }) => {
  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const dateKey = formatDate(entry.startTime);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white/[0.04] rounded-xl h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-white/15">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p className="text-[14px] font-medium">No activity found</p>
        <p className="text-[12px] text-white/20 mt-1">Try adjusting the date range or filters</p>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(grouped).map(([date, dateEntries]) => (
        <div key={date} className="mb-5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/25 mb-2 px-1">
            {date}
          </h4>
          <div className="space-y-1.5">
            {dateEntries.map((entry) => {
              const initials = `${entry.user?.firstName?.[0] || ''}${entry.user?.lastName?.[0] || ''}`.toUpperCase();
              const net = (entry.duration || 0) - (entry.totalBreakDuration || 0);
              return (
                <div
                  key={entry._id}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:bg-white/[0.05] transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/70 to-purple-500/70 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/60">
                      <span className="font-medium text-white/80">
                        {entry.user?.firstName} {entry.user?.lastName}
                      </span>
                      {' tracked '}
                      <span className="font-medium text-cyan-400/70">{formatDuration(net)}</span>
                      {entry.project && (
                        <>
                          {' on '}
                          <span className="font-medium text-white/60">{entry.project.name}</span>
                        </>
                      )}
                      {entry.task && (
                        <>
                          {' · '}
                          <span className="text-white/40">{entry.task.title}</span>
                        </>
                      )}
                    </p>
                    {entry.description && (
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{entry.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-white/30">{formatTime(entry.startTime)}</p>
                    <p className="text-[10px] text-white/20">{timeAgo(entry.startTime)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

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

export default ActivityFeed;
