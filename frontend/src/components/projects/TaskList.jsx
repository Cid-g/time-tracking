import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateTaskApi, deleteTaskApi } from '../../api/task.api';
import ConfirmModal from '../common/ConfirmModal';

const PRIORITY_STYLES = {
  low: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  medium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_STYLES = {
  todo: 'bg-white/[0.06] border-white/[0.08]',
  in_progress: 'bg-cyan-500/15 border-cyan-500/25',
  in_review: 'bg-purple-500/15 border-purple-500/25',
  completed: 'bg-emerald-500/15 border-emerald-500/25',
};

const STATUS_DOTS = {
  todo: 'bg-white/30',
  in_progress: 'bg-cyan-400',
  in_review: 'bg-purple-400',
  completed: 'bg-emerald-400',
};

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
};

const TaskList = ({ tasks, onTasksChange, canManage }) => {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskApi(taskId, { status: newStatus });
      toast.success('Task updated');
      onTasksChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTaskApi(deleteTarget);
      toast.success('Task deleted');
      setDeleteTarget(null);
      onTasksChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/30">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-white/15">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <p className="text-[14px] font-medium">No tasks yet</p>
        <p className="text-[12px] text-white/20 mt-0.5">Create a task to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl transition-all group"
          >
            {/* Status dot */}
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOTS[task.status]}`} />

            {/* Title + assignees */}
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium truncate ${
                task.status === 'completed' ? 'text-white/40 line-through' : 'text-white/80'
              }`}>
                {task.title}
              </p>
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  {task.assignees.slice(0, 3).map((a) => (
                    <span key={a._id} className="text-[10px] text-white/30">
                      {a.firstName} {a.lastName?.[0]}.
                    </span>
                  ))}
                  {task.assignees.length > 3 && (
                    <span className="text-[10px] text-white/20">+{task.assignees.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            {/* Priority badge */}
            <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>

            {/* Status selector */}
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task._id, e.target.value)}
              className="shrink-0 px-2 py-1 text-[11px] bg-white/[0.05] border border-white/[0.08] rounded-lg text-white/60 focus:outline-none cursor-pointer"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            {/* Due date */}
            {task.dueDate && (
              <span className="shrink-0 text-[11px] text-white/30">
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Estimated hours */}
            {task.estimatedHours && (
              <span className="shrink-0 text-[11px] text-white/25">{task.estimatedHours}h</span>
            )}

            {/* Delete button */}
            {canManage && (
              <button
                onClick={() => setDeleteTarget(task._id)}
                className="shrink-0 p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </>
  );
};

export default TaskList;
