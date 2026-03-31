import { useState } from 'react';
import toast from 'react-hot-toast';
import useTimeTracking from '../../hooks/useTimeTracking';
import ProjectSelector from '../common/ProjectSelector';
import TaskSelector from '../common/TaskSelector';

const formatTime = (totalSeconds) => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return { hrs, mins, secs };
};

const pad = (n) => String(n).padStart(2, '0');

const Timer = ({ onTimerStop }) => {
  const {
    activeEntry,
    netElapsed,
    elapsed,
    breakElapsed,
    isRunning,
    isPaused,
    hasActiveTimer,
    loading,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
  } = useTimeTracking();

  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleStart = async () => {
    try {
      await startTimer({
        description: description.trim(),
        project: selectedProject || undefined,
        task: selectedTask || undefined,
      });
      toast.success('Timer started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start timer');
    }
  };

  const handleStop = async () => {
    try {
      const entry = await stopTimer();
      setDescription('');
      setSelectedProject(null);
      setSelectedTask(null);
      toast.success('Timer stopped');
      onTimerStop?.(entry);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop timer');
    }
  };

  const handlePause = async () => {
    try {
      await pauseTimer();
      toast.success('Timer paused');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pause timer');
    }
  };

  const handleResume = async () => {
    try {
      await resumeTimer();
      toast.success('Timer resumed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume timer');
    }
  };

  const time = formatTime(hasActiveTimer ? netElapsed : 0);

  // Progress ring: percentage of 8h workday
  const TARGET_SECONDS = 8 * 3600;
  const progressPercent = Math.min((netElapsed / TARGET_SECONDS) * 100, 100);
  const circumference = 2 * Math.PI * 88; // radius = 88
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${
            isRunning
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
              : isPaused
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                : 'bg-white/15'
          }`} />
          <h3 className="text-[15px] font-semibold text-white">Live Session</h3>
        </div>
        {hasActiveTimer && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border ${
            isRunning
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {isRunning ? 'Tracking' : 'Paused'}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col items-center">
        {/* Circular timer display with progress ring */}
        <div className={`relative w-52 h-52 rounded-full flex items-center justify-center mb-6 ${
          isRunning
            ? 'animate-ring-pulse'
            : isPaused
              ? 'animate-ring-pulse-amber'
              : ''
        }`}>
          {/* Background ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100" cy="100" r="88"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="6"
            />
            {/* Progress ring */}
            {hasActiveTimer && (
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={isRunning ? 'rgba(6,182,212,0.6)' : 'rgba(245,158,11,0.5)'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: isRunning
                    ? 'drop-shadow(0 0 6px rgba(6,182,212,0.4))'
                    : 'drop-shadow(0 0 6px rgba(245,158,11,0.3))'
                }}
              />
            )}
          </svg>

          {/* Inner glass circle */}
          <div className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center border ${
            hasActiveTimer
              ? isRunning
                ? 'bg-cyan-500/[0.03] border-cyan-500/10'
                : 'bg-amber-500/[0.03] border-amber-500/10'
              : 'bg-white/[0.02] border-white/[0.06]'
          }`}>
            {/* Time digits */}
            <div className={`flex items-baseline gap-0.5 tabular-nums font-bold transition-colors duration-300 ${
              hasActiveTimer
                ? isRunning
                  ? 'text-cyan-400 animate-text-glow'
                  : 'text-amber-400 animate-text-glow-amber'
                : 'text-white/15'
            }`}>
              <span className="text-3xl">{pad(time.hrs)}</span>
              <span className="text-xl text-white/20 mx-0.5">:</span>
              <span className="text-3xl">{pad(time.mins)}</span>
              <span className="text-xl text-white/20 mx-0.5">:</span>
              <span className="text-3xl">{pad(time.secs)}</span>
            </div>

            {/* Status label under time */}
            {hasActiveTimer && (
              <div className="mt-1.5">
                <span className={`text-[11px] font-semibold uppercase tracking-widest ${
                  isRunning ? 'text-cyan-500/50' : 'text-amber-500/50'
                }`}>
                  {isRunning ? 'Working' : 'On Break'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Workday progress bar */}
        {hasActiveTimer && (
          <div className="w-full mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Daily Progress</span>
              <span className="text-[12px] font-semibold text-white/50 tabular-nums">
                {pad(time.hrs)}h {pad(time.mins)}m / 8h 00m
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear animate-progress-fill ${
                  isRunning
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Break / Total elapsed info */}
        {hasActiveTimer && breakElapsed > 0 && (
          <div className="flex items-center justify-center gap-4 mb-5 w-full">
            <div className="flex items-center gap-1.5 text-[12px] text-white/35">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
              <span>Break: <span className="text-amber-400/70 font-semibold">{pad(formatTime(breakElapsed).hrs)}:{pad(formatTime(breakElapsed).mins)}:{pad(formatTime(breakElapsed).secs)}</span></span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-[12px] text-white/35">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Total: <span className="text-white/60 font-semibold">{pad(formatTime(elapsed).hrs)}:{pad(formatTime(elapsed).mins)}:{pad(formatTime(elapsed).secs)}</span></span>
            </div>
          </div>
        )}

        {/* Active description & project/task info */}
        {hasActiveTimer && (activeEntry?.description || activeEntry?.project) && (
          <div className="flex flex-col gap-2 mb-5 w-full">
            {activeEntry?.description && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/25 shrink-0">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <p className="text-[13px] text-white/50 font-medium truncate">{activeEntry.description}</p>
              </div>
            )}
            {activeEntry?.project && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeEntry.project.color || '#06b6d4' }}
                />
                <span className="text-[12px] text-white/50 font-medium truncate">{activeEntry.project.name}</span>
                {activeEntry?.task && (
                  <>
                    <span className="text-white/20">/</span>
                    <span className="text-[12px] text-white/40 truncate">{activeEntry.task.title}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description input + project/task selectors (before start) */}
        {!hasActiveTimer && (
          <div className="w-full mb-5 flex flex-col gap-3">
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleStart()}
                placeholder="What are you working on?"
                maxLength={500}
                className="w-full pl-10 pr-4 py-3 text-[14px] bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/30 focus:shadow-[0_0_15px_rgba(6,182,212,0.08)] transition-all duration-150"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <ProjectSelector
                value={selectedProject}
                onChange={(id) => {
                  setSelectedProject(id);
                  setSelectedTask(null);
                }}
              />
              <TaskSelector
                projectId={selectedProject}
                value={selectedTask}
                onChange={setSelectedTask}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 w-full">
          {!hasActiveTimer ? (
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-[14px] font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.45)] hover:-translate-y-0.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Timer
            </button>
          ) : (
            <>
              {isRunning ? (
                <button
                  onClick={handlePause}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/30 text-[14px] font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                  Pause
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 text-[14px] font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Resume
                </button>
              )}

              <button
                onClick={handleStop}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-[14px] font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
                Stop
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timer;
