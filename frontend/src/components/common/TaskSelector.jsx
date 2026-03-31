import { useState, useRef, useEffect } from 'react';
import { listTasksApi } from '../../api/task.api';

const PRIORITY_COLORS = {
  low: 'bg-slate-400',
  medium: 'bg-cyan-400',
  high: 'bg-amber-400',
  urgent: 'bg-red-400',
};

const TaskSelector = ({ projectId, value, onChange, className = '' }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = tasks.find((t) => t._id === value);

  // Fetch tasks when projectId changes
  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      onChange(null);
      return;
    }

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const { data } = await listTasksApi(projectId, { limit: 100 });
        setTasks(data.data.tasks || []);
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!projectId) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-left text-[14px] text-white/70 hover:bg-white/[0.08] hover:border-white/[0.12] transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40"
      >
        {selected ? (
          <>
            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[selected.priority] || 'bg-cyan-400'}`} />
            <span className="text-white/90 truncate">{selected.title}</span>
          </>
        ) : (
          <span className="text-white/40">Select task...</span>
        )}
        <svg className="w-4 h-4 ml-auto text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-white/40 hover:bg-white/[0.06] transition-colors"
          >
            No task
          </button>

          {loading ? (
            <div className="px-3.5 py-2 text-[13px] text-white/30">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="px-3.5 py-2 text-[13px] text-white/30">No tasks in this project</div>
          ) : (
            tasks.map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => {
                  onChange(task._id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-white/[0.06] transition-colors ${
                  value === task._id ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/70'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority] || 'bg-cyan-400'}`} />
                <span className="truncate">{task.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TaskSelector;
