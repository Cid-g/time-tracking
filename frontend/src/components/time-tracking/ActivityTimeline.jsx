import { useState, useEffect } from 'react';
import { listTimeEntriesApi } from '../../api/timeEntry.api';

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'a' : 'p';
  return `${h}${ampm}`;
});

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

const formatTimeShort = (date) => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const ActivityTimeline = ({ refreshKey, activeEntry, netElapsed }) => {
  const [entries, setEntries] = useState([]);
  const [hoveredEntry, setHoveredEntry] = useState(null);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
        const { data } = await listTimeEntriesApi({ startDate, endDate, limit: 100 });
        setEntries(data.data.entries);
      } catch {
        // Silently fail
      }
    };
    fetchToday();
  }, [refreshKey]);

  // Compute total today
  const totalToday = entries.reduce(
    (sum, e) => sum + Math.max(0, (e.duration || 0) - (e.totalBreakDuration || 0)),
    0
  ) + (activeEntry ? netElapsed : 0);

  // Get the hour range to display (use 6am-10pm or actual range)
  const now = new Date();
  let minHour = 6;
  let maxHour = 22;

  const allTimes = entries.flatMap(e => [new Date(e.startTime), e.endTime ? new Date(e.endTime) : now]);
  if (activeEntry) allTimes.push(new Date(activeEntry.startTime), now);
  if (allTimes.length > 0) {
    const earliestHour = Math.min(...allTimes.map(d => d.getHours()));
    const latestHour = Math.max(...allTimes.map(d => d.getHours())) + 1;
    minHour = Math.min(minHour, earliestHour);
    maxHour = Math.max(maxHour, latestHour);
  }
  maxHour = Math.min(maxHour, 24);

  const totalMinutes = (maxHour - minHour) * 60;

  const getBlockStyle = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : now;
    const startMin = (start.getHours() - minHour) * 60 + start.getMinutes();
    const endMin = (end.getHours() - minHour) * 60 + end.getMinutes();
    const left = Math.max(0, (startMin / totalMinutes) * 100);
    const width = Math.max(0.5, ((endMin - startMin) / totalMinutes) * 100);
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  const hourMarkers = [];
  for (let h = minHour; h <= maxHour; h += 2) {
    const left = ((h - minHour) * 60 / totalMinutes) * 100;
    if (h < maxHour) {
      hourMarkers.push({ label: HOUR_LABELS[h], left: `${left}%` });
    }
  }

  // Current time indicator
  const nowMin = (now.getHours() - minHour) * 60 + now.getMinutes();
  const nowLeft = (nowMin / totalMinutes) * 100;

  return (
    <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-semibold text-white">Activity Timeline</h3>
          <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Today</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-white tabular-nums">{formatDuration(totalToday)}</span>
          <span className="text-[11px] text-white/25">/</span>
          <span className="text-[13px] text-white/40 tabular-nums">8h 00m</span>
        </div>
      </div>

      <div className="p-6">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
            <span className="text-[11px] text-white/30 font-medium">Timer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" />
            <span className="text-[11px] text-white/30 font-medium">Manual</span>
          </div>
          {activeEntry && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400/80 animate-pulse" />
              <span className="text-[11px] text-white/30 font-medium">Active</span>
            </div>
          )}
        </div>

        {/* Timeline track */}
        <div className="relative">
          {/* Hour labels */}
          <div className="relative h-4 mb-1">
            {hourMarkers.map(({ label, left }) => (
              <span
                key={label}
                className="absolute text-[10px] text-white/20 font-medium tabular-nums -translate-x-1/2"
                style={{ left }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Track */}
          <div className="relative h-10 bg-white/[0.03] rounded-lg border border-white/[0.05] overflow-hidden">
            {/* Hour gridlines */}
            {hourMarkers.map(({ label, left }) => (
              <div
                key={`line-${label}`}
                className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
                style={{ left }}
              />
            ))}

            {/* Completed entry blocks */}
            {entries.map((entry) => {
              const style = getBlockStyle(entry.startTime, entry.endTime);
              const isTimer = entry.entryType === 'timer';
              const netDur = Math.max(0, (entry.duration || 0) - (entry.totalBreakDuration || 0));
              return (
                <div
                  key={entry._id}
                  className={`absolute top-1 bottom-1 rounded-md cursor-pointer transition-all duration-150 ${
                    hoveredEntry === entry._id ? 'opacity-100 z-10' : 'opacity-80 hover:opacity-100'
                  } ${
                    isTimer
                      ? 'bg-gradient-to-r from-emerald-500/50 to-emerald-500/30 border border-emerald-500/20'
                      : 'bg-gradient-to-r from-blue-500/50 to-blue-500/30 border border-blue-500/20'
                  }`}
                  style={style}
                  onMouseEnter={() => setHoveredEntry(entry._id)}
                  onMouseLeave={() => setHoveredEntry(null)}
                >
                  {/* Tooltip */}
                  {hoveredEntry === entry._id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-lg border border-white/[0.1] shadow-xl z-20 whitespace-nowrap">
                      <p className="text-[12px] font-semibold text-white mb-0.5">
                        {entry.description || 'No description'}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {formatTimeShort(new Date(entry.startTime))} — {formatTimeShort(new Date(entry.endTime))} · {formatDuration(netDur)}
                      </p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a2e]/95 border-r border-b border-white/[0.1] rotate-45 -mt-1" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active timer block (pulsing) */}
            {activeEntry && (
              <div
                className="absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-cyan-500/50 to-cyan-400/30 border border-cyan-500/30 animate-pulse"
                style={getBlockStyle(activeEntry.startTime, null)}
              />
            )}

            {/* Current time needle */}
            {nowLeft > 0 && nowLeft < 100 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400/70 z-10"
                style={{ left: `${nowLeft}%` }}
              >
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-white/25">{entries.length} sessions</span>
            {activeEntry && (
              <>
                <span className="text-white/10">·</span>
                <span className="text-[12px] text-cyan-400/60 font-medium">1 active</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              totalToday >= 8 * 3600
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                : totalToday >= 4 * 3600
                  ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                  : 'bg-white/20'
            }`} />
            <span className="text-[12px] text-white/30 font-medium">
              {totalToday >= 8 * 3600 ? 'Target reached' : `${formatDuration(Math.max(0, 8 * 3600 - totalToday))} remaining`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTimeline;
