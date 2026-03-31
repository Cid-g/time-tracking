import { useState, useEffect, useCallback } from 'react';
import useClient from '../../hooks/useClient';
import ClientProjectDetailModal from './ClientProjectDetailModal';

const STATUS_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'archived', label: 'Archived' },
];

const formatHours = (hours) => {
  if (!hours || hours <= 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const ClientProjectsTab = ({ onViewReport }) => {
  const { projects, projectsPagination, projectsLoading, loadProjects } = useClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailProjectId, setDetailProjectId] = useState(null);

  const fetchProjects = useCallback(
    (page = 1) => {
      const params = { page, limit: 12 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      loadProjects(params);
    },
    [statusFilter, search, loadProjects]
  );

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  const { page, pages } = projectsPagination;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status pills */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer ${
                statusFilter === opt.key
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all w-56"
          />
        </div>
      </div>

      {/* Project Grid */}
      {projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] h-52 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-white/15">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-[15px] font-medium">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const budgetPct = project.budgetHours
              ? Math.min(100, Math.round((project.hoursTracked / project.budgetHours) * 100))
              : null;
            const taskPct = project.taskStats?.total > 0
              ? Math.round((project.taskStats.completed / project.taskStats.total) * 100)
              : 0;

            return (
              <div
                key={project._id}
                onClick={() => setDetailProjectId(project._id)}
                className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group"
              >
                {/* Color bar top */}
                <div className="h-1" style={{ backgroundColor: project.color || '#06b6d4' }} />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[14px] font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {project.name}
                      </h4>
                      {project.description && (
                        <p className="text-[12px] text-white/25 truncate mt-0.5">{project.description}</p>
                      )}
                    </div>
                    <span className={`ml-3 text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                      project.status === 'completed' ? 'bg-cyan-500/10 text-cyan-400' :
                      project.status === 'on_hold' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-white/[0.06] text-white/40'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-cyan-400">{formatHours(project.hoursTracked)}</p>
                      <p className="text-[10px] text-white/25">Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-purple-400">{project.memberCount || 0}</p>
                      <p className="text-[10px] text-white/25">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[16px] font-bold text-amber-400">{project.taskStats?.total || 0}</p>
                      <p className="text-[10px] text-white/25">Tasks</p>
                    </div>
                  </div>

                  {/* Task progress */}
                  {project.taskStats?.total > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-white/30">Tasks</span>
                        <span className="text-white/50">{project.taskStats.completed}/{project.taskStats.total}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-400 transition-all duration-500"
                          style={{ width: `${taskPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Budget progress */}
                  {budgetPct !== null && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-white/30">Budget</span>
                        <span className={`font-medium ${budgetPct >= 90 ? 'text-red-400' : budgetPct >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatHours(project.hoursTracked)} / {project.budgetHours}h ({budgetPct}%)
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button
            onClick={() => fetchProjects(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg text-[12px] font-medium text-white/40 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            &lt;
          </button>
          {[...Array(pages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => fetchProjects(i + 1)}
              className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                page === i + 1
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-white/40 hover:bg-white/[0.06]'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => fetchProjects(page + 1)}
            disabled={page >= pages}
            className="w-8 h-8 rounded-lg text-[12px] font-medium text-white/40 hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            &gt;
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailProjectId && (
        <ClientProjectDetailModal
          projectId={detailProjectId}
          onClose={() => setDetailProjectId(null)}
          onViewReport={(id) => {
            setDetailProjectId(null);
            onViewReport(id);
          }}
        />
      )}
    </div>
  );
};

export default ClientProjectsTab;
