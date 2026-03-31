const formatValue = (val) => {
  if (val === null || val === undefined) return '—';
  if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}/.test(val))) {
    return new Date(val).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
};

const AuditDetailModal = ({ log, onClose }) => {
  const hasBefore = log.changes?.before && Object.keys(log.changes.before).length > 0;
  const hasAfter = log.changes?.after && Object.keys(log.changes.after).length > 0;
  const hasChanges = hasBefore || hasAfter;

  // Get all keys from before and after
  const changeKeys = hasChanges
    ? [...new Set([
        ...Object.keys(log.changes?.before || {}),
        ...Object.keys(log.changes?.after || {}),
      ])]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0f1425]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <h2 className="text-[16px] font-bold text-white">Audit Log Detail</h2>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-all cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-white/30 block mb-1">Timestamp</span>
              <span className="text-[13px] text-white/70">
                {new Date(log.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-white/30 block mb-1">Action</span>
              <span className="text-[13px] text-cyan-400 font-medium">{log.action?.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-[11px] text-white/30 block mb-1">User</span>
              <span className="text-[13px] text-white/70">
                {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                {log.user?.email && <span className="text-white/25 ml-1">({log.user.email})</span>}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-white/30 block mb-1">IP Address</span>
              <span className="text-[13px] text-white/50 font-mono">{log.ipAddress || '—'}</span>
            </div>
            {log.target?.type && (
              <div>
                <span className="text-[11px] text-white/30 block mb-1">Target</span>
                <span className="text-[13px] text-white/50">{log.target.type}</span>
                {log.target.id && (
                  <span className="text-[10px] text-white/20 font-mono ml-2">{log.target.id}</span>
                )}
              </div>
            )}
            {log.details?.reason && (
              <div className="col-span-2">
                <span className="text-[11px] text-white/30 block mb-1">Reason</span>
                <span className="text-[13px] text-amber-400/70">{log.details.reason}</span>
              </div>
            )}
          </div>

          {/* Diff Viewer */}
          {hasChanges && (
            <div>
              <h3 className="text-[13px] font-semibold text-white/60 mb-3">Changes</h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Before */}
                <div className="bg-red-500/[0.03] border border-red-500/10 rounded-xl p-4">
                  <span className="text-[11px] font-bold text-red-400/60 uppercase tracking-wider block mb-3">Before</span>
                  {hasBefore ? (
                    <div className="space-y-2">
                      {changeKeys.map((key) => {
                        const val = log.changes.before?.[key];
                        return (
                          <div key={key}>
                            <span className="text-[10px] text-white/25 block">{key}</span>
                            <span className="text-[12px] text-red-300/60 font-mono break-all">
                              {formatValue(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[12px] text-white/20">N/A</span>
                  )}
                </div>

                {/* After */}
                <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-4">
                  <span className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-wider block mb-3">After</span>
                  {hasAfter ? (
                    <div className="space-y-2">
                      {changeKeys.map((key) => {
                        const val = log.changes.after?.[key];
                        const changed = JSON.stringify(log.changes.before?.[key]) !== JSON.stringify(val);
                        return (
                          <div key={key}>
                            <span className="text-[10px] text-white/25 block">{key}</span>
                            <span className={`text-[12px] font-mono break-all ${
                              changed ? 'text-emerald-300/70' : 'text-white/30'
                            }`}>
                              {formatValue(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[12px] text-white/20">N/A</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Raw Details */}
          {log.details && Object.keys(log.details).length > 0 && !log.details.reason && (
            <div>
              <h3 className="text-[13px] font-semibold text-white/60 mb-3">Details</h3>
              <pre className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-[11px] text-white/40 font-mono overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditDetailModal;
