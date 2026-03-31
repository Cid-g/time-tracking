import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listProjectsApi, getProjectSummaryApi } from '../../api/project.api';
import useAuth from '../../hooks/useAuth';
import CreateProjectModal from '../../components/projects/CreateProjectModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_BADGES = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  archived: 'bg-white/[0.06] text-white/40 border-white/[0.08]',
};

const formatHours = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const canCreate = user?.role === 'manager' || user?.role === 'superadmin';

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 12 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const { data } = await listProjectsApi(params);
      const projectList = data.data.projects || [];
      setProjects(projectList);
      setPagination(data.data.pagination);

      // Fetch summaries for each project
      const summaryPromises = projectList.map(async (p) => {
        try {
          const { data: sData } = await getProjectSummaryApi(p._id);
          return [p._id, sData.data.summary];
        } catch {
          return [p._id, null];
        }
      });
      const results = await Promise.all(summaryPromises);
      setSummaries(Object.fromEntries(results));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    fetchProjects();
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-[13px] text-white/40 mt-1">{pagination.total} project{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-[13px] font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
                statusFilter === opt.value
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] h-48 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-white/15">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-[15px] font-medium">No projects found</p>
          <p className="text-[13px] text-white/20 mt-1">
            {canCreate ? 'Create your first project to get started' : 'No projects assigned to you yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => {
            const summary = summaries[project._id];
            const budgetPercent = project.budgetHours && summary
              ? Math.min((summary.netDuration / (project.budgetHours * 3600)) * 100, 100)
              : 0;

            return (
              <button
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className="text-left bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group"
              >
                {/* Color bar */}
                <div className="h-1" style={{ backgroundColor: project.color || '#06b6d4' }} />

                <div className="p-5">
                  {/* Name + status */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[15px] font-semibold text-white group-hover:text-cyan-400 transition-colors truncate pr-3">
                      {project.name}
                    </h3>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${STATUS_BADGES[project.status] || STATUS_BADGES.active}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-[12px] text-white/35 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-[12px] text-white/40">
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>{project.members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{summary ? formatHours(summary.netDuration) : '0h 00m'}</span>
                    </div>
                    {project.billingType !== 'non_billable' && summary && (
                      <div className="flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>{formatHours(summary.billableSeconds)} billable</span>
                      </div>
                    )}
                  </div>

                  {/* Budget progress */}
                  {project.budgetHours && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-white/25">Budget</span>
                        <span className="text-[11px] text-white/35">
                          {summary ? formatHours(summary.netDuration) : '0h'} / {project.budgetHours}h
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            budgetPercent > 90
                              ? 'bg-red-400'
                              : budgetPercent > 70
                                ? 'bg-amber-400'
                                : 'bg-cyan-400'
                          }`}
                          style={{ width: `${budgetPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPagination((prev) => ({ ...prev, page: i + 1 }))}
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

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default ProjectsPage;
