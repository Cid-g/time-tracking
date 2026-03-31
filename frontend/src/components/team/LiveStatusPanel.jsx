import { useState, useEffect } from 'react';

const formatElapsed = (startTime) => {
  if (!startTime) return '0:00:00';
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const LiveStatusPanel = ({ activeMembers = [] }) => {
  const [, setTick] = useState(0);

  // Update elapsed times every second
  useEffect(() => {
    if (activeMembers.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeMembers.length]);

  if (activeMembers.length === 0) {
    return (
      <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 mb-5">
        <p className="text-[13px] text-white/30 text-center">No team members are currently working</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        <h3 className="text-[13px] font-semibold text-white/70">
          {activeMembers.length} member{activeMembers.length !== 1 ? 's' : ''} working now
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {activeMembers.map((entry) => {
          const initials = `${entry.user?.firstName?.[0] || ''}${entry.user?.lastName?.[0] || ''}`.toUpperCase();
          return (
            <div
              key={entry._id}
              className="flex items-center gap-3 px-3 py-2.5 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white">
                  {initials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1423] animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-white/70 truncate">
                  {entry.user?.firstName} {entry.user?.lastName}
                </p>
                <p className="text-[11px] text-white/30 truncate">
                  {entry.project?.name || 'No project'}
                  {entry.task?.title && ` · ${entry.task.title}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[12px] font-mono font-medium ${entry.status === 'paused' ? 'text-amber-400/70' : 'text-emerald-400/80'}`}>
                  {formatElapsed(entry.startTime)}
                </span>
                {entry.status === 'paused' && (
                  <p className="text-[9px] text-amber-400/50 uppercase font-bold tracking-wider">Paused</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveStatusPanel;
