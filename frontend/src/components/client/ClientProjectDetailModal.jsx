import { useState, useEffect } from 'react';
import useClient from '../../hooks/useClient';
import toast from 'react-hot-toast';

const formatHours = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const ClientProjectDetailModal = ({ projectId, onClose, onViewReport }) => {
  const { getProjectDetail } = useClient();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const result = await getProjectDetail(projectId);
        if (!cancelled) setData(result);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load project');
        if (!cancelled) onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectId, getProjectDetail, onClose]);

  const maxDaily = data?.dailyBreakdown?.length > 0
    ? Math.max(...data.dailyBreakdown.map((d) => d.totalSeconds))
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl animate-fade-in-up">
        {loading ? (
          <div className="p-8 flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: data.project?.color || '#06b6d4' }}
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-white truncate">{data.project?.name}</h2>
                    {data.project?.description && (
                      <p className="text-[13px] text-white/35 mt-0.5 line-clamp-2">{data.project.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/30 hover:text-white/60 transition-colors cursor-pointer shrink-0 ml-3"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Status + billing */}
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  data.project?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                  data.project?.status === 'completed' ? 'bg-cyan-500/10 text-cyan-400' :
                  data.project?.status === 'on_hold' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-white/[0.06] text-white/40'
                }`}>
                  {data.project?.status}
                </span>
                {data.project?.billingType && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                    {data.project.billingType}
                  </span>
                )}
                {data.project?.hourlyRate && (
                  <span className="text-[11px] text-white/30">${data.project.hourlyRate}/hr</span>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 p-6 border-b border-white/[0.06]">
              <div className="text-center">
                <p className="text-xl font-bold text-cyan-400">{data.summary?.hoursTracked || 0}h</p>
                <p className="text-[11px] text-white/30">Total Hours</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">{data.summary?.billableHours || 0}h</p>
                <p className="text-[11px] text-white/30">Billable</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-400">{data.summary?.entryCount || 0}</p>
                <p className="text-[11px] text-white/30">Entries</p>
              </div>
            </div>

            {/* Task Progress */}
            {data.taskProgress && data.taskProgress.total > 0 && (
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-semibold text-white mb-3">Task Progress</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { label: 'Completed', count: data.taskProgress.completed, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
                    { label: 'In Progress', count: data.taskProgress.inProgress, color: 'bg-cyan-400', textColor: 'text-cyan-400' },
                    { label: 'In Review', count: data.taskProgress.inReview, color: 'bg-purple-400', textColor: 'text-purple-400' },
                    { label: 'To Do', count: data.taskProgress.todo, color: 'bg-white/30', textColor: 'text-white/50' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-[12px] text-white/40">{s.label}</span>
                      <span className={`text-[12px] font-semibold ${s.textColor}`}>{s.count}</span>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mt-3 flex">
                  {data.taskProgress.completed > 0 && (
                    <div className="h-full bg-emerald-400" style={{ width: `${(data.taskProgress.completed / data.taskProgress.total) * 100}%` }} />
                  )}
                  {data.taskProgress.inProgress > 0 && (
                    <div className="h-full bg-cyan-400" style={{ width: `${(data.taskProgress.inProgress / data.taskProgress.total) * 100}%` }} />
                  )}
                  {data.taskProgress.inReview > 0 && (
                    <div className="h-full bg-purple-400" style={{ width: `${(data.taskProgress.inReview / data.taskProgress.total) * 100}%` }} />
                  )}
                </div>
              </div>
            )}

            {/* Team Members */}
            {data.project?.members?.length > 0 && (
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-semibold text-white mb-3">Team ({data.project.members.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {data.project.members.map((m) => (
                    <div
                      key={m._id}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                        {m.firstName?.[0]}{m.lastName?.[0]}
                      </div>
                      <span className="text-[12px] text-white/60">{m.firstName} {m.lastName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Activity (30 days) */}
            {data.dailyBreakdown?.length > 0 && (
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-semibold text-white mb-3">Daily Activity (Last 30 Days)</h3>
                <div className="flex items-end gap-[3px] h-24">
                  {data.dailyBreakdown.map((d) => (
                    <div
                      key={d.date}
                      className="flex-1 bg-emerald-400/60 rounded-t-sm hover:bg-emerald-400 transition-colors min-w-[4px]"
                      style={{ height: `${Math.max(4, (d.totalSeconds / maxDaily) * 100)}%` }}
                      title={`${d.date}: ${formatHours(d.totalSeconds)}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Member Breakdown */}
            {data.memberBreakdown?.length > 0 && (
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-semibold text-white mb-3">Hours by Member</h3>
                <div className="space-y-2.5">
                  {data.memberBreakdown.map((m) => {
                    const maxSeconds = data.memberBreakdown[0].totalSeconds || 1;
                    const pct = Math.round((m.totalSeconds / maxSeconds) * 100);
                    return (
                      <div key={m.userId}>
                        <div className="flex items-center justify-between text-[12px] mb-1">
                          <span className="text-white/60">{m.firstName} {m.lastName}</span>
                          <span className="text-cyan-400 font-medium">{formatHours(m.totalSeconds)}</span>
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
              </div>
            )}

            {/* Footer */}
            <div className="p-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-medium text-white/50 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl border border-white/[0.08] transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => onViewReport(projectId)}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              >
                View Full Report
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ClientProjectDetailModal;
