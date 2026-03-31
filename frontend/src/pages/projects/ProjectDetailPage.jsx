import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProjectApi, updateProjectApi, getProjectSummaryApi, addProjectMembersApi, removeProjectMemberApi } from '../../api/project.api';
import { listTasksApi, createTaskApi } from '../../api/task.api';
import { listTimeEntriesApi } from '../../api/timeEntry.api';
import useAuth from '../../hooks/useAuth';
import TaskList from '../../components/projects/TaskList';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_BADGES = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  archived: 'bg-white/[0.06] text-white/40 border-white/[0.08]',
};

const TABS = ['Overview', 'Tasks', 'Members', 'Time Logs'];

const formatHours = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  // Task creation state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium' });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const canManage = user?.role === 'superadmin' ||
    project?.managers?.some((m) => (m._id || m).toString() === user?._id);

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await getProjectApi(id);
      setProject(data.data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project');
      navigate('/projects');
    }
  }, [id, navigate]);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await getProjectSummaryApi(id);
      setSummary(data.data.summary);
    } catch {
      // summary is optional
    }
  }, [id]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await listTasksApi(id, { limit: 100 });
      setTasks(data.data.tasks || []);
    } catch {
      setTasks([]);
    }
  }, [id]);

  const fetchTimeEntries = useCallback(async () => {
    try {
      const { data } = await listTimeEntriesApi({ project: id, limit: 20 });
      setTimeEntries(data.data.entries || []);
    } catch {
      setTimeEntries([]);
    }
  }, [id]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchSummary(), fetchTasks(), fetchTimeEntries()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchProject, fetchSummary, fetchTasks, fetchTimeEntries]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    setTaskSubmitting(true);
    try {
      await createTaskApi(id, {
        title: taskForm.title.trim(),
        priority: taskForm.priority,
      });
      toast.success('Task created');
      setTaskForm({ title: '', priority: 'medium' });
      setShowTaskForm(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeProjectMemberApi(id, userId);
      toast.success('Member removed');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateProjectApi(id, { status: newStatus });
      toast.success('Status updated');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!project) return null;

  const budgetPercent = project.budgetHours && summary
    ? Math.min((summary.netDuration / (project.budgetHours * 3600)) * 100, 100)
    : 0;

  return (
    <div className="animate-fade-in-up">
      {/* Back button + header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/60 transition-colors mb-3 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Projects
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-8 rounded-full" style={{ backgroundColor: project.color || '#06b6d4' }} />
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-[13px] text-white/40 mt-1 max-w-xl">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1.5 text-[12px] bg-white/[0.05] border border-white/[0.08] rounded-lg text-white/60 focus:outline-none cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            )}
            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${STATUS_BADGES[project.status]}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stats cards */}
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
            <div className="text-[12px] text-white/35 uppercase tracking-wider mb-1">Total Hours</div>
            <div className="text-2xl font-bold text-white">{summary ? formatHours(summary.netDuration) : '0h 00m'}</div>
            <div className="text-[12px] text-white/25 mt-0.5">{summary?.entryCount || 0} entries</div>
          </div>

          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
            <div className="text-[12px] text-white/35 uppercase tracking-wider mb-1">Billable Hours</div>
            <div className="text-2xl font-bold text-cyan-400">{summary ? formatHours(summary.billableSeconds) : '0h 00m'}</div>
            {project.hourlyRate && (
              <div className="text-[12px] text-white/25 mt-0.5">
                ${((summary?.billableSeconds || 0) / 3600 * project.hourlyRate).toFixed(2)} value
              </div>
            )}
          </div>

          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
            <div className="text-[12px] text-white/35 uppercase tracking-wider mb-1">Tasks</div>
            <div className="text-2xl font-bold text-purple-400">{tasks.length}</div>
            <div className="text-[12px] text-white/25 mt-0.5">
              {tasks.filter((t) => t.status === 'completed').length} completed
            </div>
          </div>

          {/* Budget progress */}
          {project.budgetHours && (
            <div className="lg:col-span-3 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-white/50 font-medium">Budget Progress</span>
                <span className="text-[13px] text-white/40">
                  {summary ? formatHours(summary.netDuration) : '0h'} / {project.budgetHours}h
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    budgetPercent > 90 ? 'bg-red-400' : budgetPercent > 70 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-white/25 mt-1">{budgetPercent.toFixed(1)}% used</div>
            </div>
          )}

          {/* Project info */}
          <div className="lg:col-span-3 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5">
            <h3 className="text-[14px] font-semibold text-white/70 mb-3">Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
              <div>
                <span className="text-white/30">Billing</span>
                <p className="text-white/70 mt-0.5 capitalize">{project.billingType.replace('_', '-')}</p>
              </div>
              {project.hourlyRate && (
                <div>
                  <span className="text-white/30">Rate</span>
                  <p className="text-white/70 mt-0.5">${project.hourlyRate}/hr</p>
                </div>
              )}
              <div>
                <span className="text-white/30">Start</span>
                <p className="text-white/70 mt-0.5">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <span className="text-white/30">End</span>
                <p className="text-white/70 mt-0.5">{formatDate(project.endDate)}</p>
              </div>
            </div>

            {/* Member breakdown */}
            {summary?.memberBreakdown?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <h4 className="text-[13px] font-semibold text-white/50 mb-3">Member Breakdown</h4>
                <div className="flex flex-col gap-2">
                  {summary.memberBreakdown.map((m) => (
                    <div key={m.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {m.firstName?.[0]}{m.lastName?.[0]}
                        </div>
                        <span className="text-[13px] text-white/60">{m.firstName} {m.lastName}</span>
                      </div>
                      <span className="text-[13px] text-white/40 tabular-nums">{formatHours(m.netDuration)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Tasks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-white/40">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
            {canManage && (
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 rounded-xl border border-cyan-500/20 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Task
              </button>
            )}
          </div>

          {/* Quick task creation form */}
          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="flex items-center gap-2.5 mb-4 p-4 bg-white/[0.04] rounded-xl border border-white/[0.08]">
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title..."
                className="flex-1 px-3.5 py-2 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                autoFocus
              />
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
                className="px-2.5 py-2 text-[12px] bg-white/[0.05] border border-white/[0.08] rounded-lg text-white/60 focus:outline-none cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="submit"
                disabled={taskSubmitting || !taskForm.title.trim()}
                className="px-4 py-2 text-[12px] font-semibold text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {taskSubmitting ? '...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
                className="px-3 py-2 text-[12px] text-white/40 hover:text-white/60 cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          <TaskList
            tasks={tasks}
            onTasksChange={fetchTasks}
            canManage={canManage}
          />
        </div>
      )}

      {activeTab === 'Members' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-white/40">{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex flex-col gap-2">
            {project.members?.map((member) => {
              const m = member._id ? member : { _id: member, firstName: '?', lastName: '', email: '' };
              const isManager = project.managers?.some((mgr) => (mgr._id || mgr).toString() === m._id.toString());

              return (
                <div
                  key={m._id}
                  className="flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[13px] font-bold text-white">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white/80">{m.firstName} {m.lastName}</p>
                      {m.email && <p className="text-[11px] text-white/30">{m.email}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isManager && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 rounded-md border border-purple-500/20">
                        Manager
                      </span>
                    )}
                    {canManage && m._id.toString() !== user?._id && (
                      <button
                        onClick={() => handleRemoveMember(m._id)}
                        className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Time Logs' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] text-white/40">{timeEntries.length} recent entries</span>
          </div>

          {timeEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-white/15">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <p className="text-[14px] font-medium">No time entries yet</p>
              <p className="text-[12px] text-white/20 mt-0.5">Track time against this project to see entries here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {timeEntries.map((entry) => (
                <div key={entry._id} className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/70 truncate">
                      {entry.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/30">
                      <span>{formatDate(entry.startTime)}</span>
                      <span>{formatTime(entry.startTime)} — {formatTime(entry.endTime)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-[13px] font-semibold text-white/50 tabular-nums ml-4">
                    {formatHours(entry.duration - (entry.totalBreakDuration || 0))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
