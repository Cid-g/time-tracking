import useClient from '../../hooks/useClient';

const formatHours = (hours) => {
  if (!hours || hours <= 0) return '0h 0m';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const ClientDashboardTab = ({ onViewProject }) => {
  const { dashboard, dashboardLoading } = useClient();

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard || dashboard.projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-white/15">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p className="text-[15px] font-medium mb-1">No Projects Yet</p>
        <p className="text-[13px] text-white/20">Projects assigned to you will appear here.</p>
      </div>
    );
  }

  const { recentActivity, projects } = dashboard;

  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
        <h3 className="text-[15px] font-semibold text-white mb-4">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <p className="text-[13px] text-white/30 py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.project?.color || '#06b6d4' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-white/70 font-medium truncate">
                      {entry.user?.firstName} {entry.user?.lastName}
                    </span>
                    <span className="text-white/20">-</span>
                    <span className="text-white/40 truncate">{entry.project?.name}</span>
                  </div>
                  {entry.task?.title && (
                    <p className="text-[12px] text-white/25 truncate mt-0.5">{entry.task.title}</p>
                  )}
                </div>
                <div className="text-[13px] text-emerald-400 font-medium shrink-0">
                  {formatHours((entry.duration - entry.totalBreakDuration) / 3600)}
                </div>
                <div className="text-[12px] text-white/25 shrink-0">
                  {new Date(entry.startTime).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects Quick View */}
      <div>
        <h3 className="text-[15px] font-semibold text-white mb-4">Your Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const budgetPct = project.budgetHours
              ? Math.min(100, Math.round((project.hoursTracked / project.budgetHours) * 100))
              : null;

            return (
              <button
                key={project._id}
                onClick={() => onViewProject(project._id)}
                className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 text-left hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group"
              >
                {/* Color bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: project.color || '#06b6d4' }}
                  />
                  <h4 className="text-[14px] font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {project.name}
                  </h4>
                  <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                    project.status === 'completed' ? 'bg-cyan-500/10 text-cyan-400' :
                    project.status === 'on_hold' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-white/[0.06] text-white/40'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[12px] text-white/35 mb-3">
                  <span>{formatHours(project.hoursTracked)} tracked</span>
                  <span>{project.entryCount} entries</span>
                </div>

                {/* Budget progress */}
                {budgetPct !== null && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-white/30">Budget</span>
                      <span className={`font-medium ${budgetPct >= 90 ? 'text-red-400' : budgetPct >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {budgetPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          budgetPct >= 90 ? 'bg-red-400' : budgetPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardTab;
