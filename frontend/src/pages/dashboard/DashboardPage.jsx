import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTimeTracking from '../../hooks/useTimeTracking';
import { getTimeSummaryApi, getDailyBreakdownApi, listTimeEntriesApi } from '../../api/timeEntry.api';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 00m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasActiveTimer, netElapsed, isRunning, isPaused } = useTimeTracking();
  const [todaySummary, setTodaySummary] = useState(null);
  const [weekSummary, setWeekSummary] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset).toISOString();

        const [todayRes, weekRes, entriesRes, breakdownRes] = await Promise.all([
          getTimeSummaryApi({ startDate: todayStart, endDate: todayEnd }),
          getTimeSummaryApi({ startDate: weekStart, endDate: todayEnd }),
          listTimeEntriesApi({ limit: 5 }),
          getDailyBreakdownApi({ startDate: weekStart, endDate: todayEnd }),
        ]);

        setTodaySummary(todayRes.data.data.summary);
        setWeekSummary(weekRes.data.data.summary);
        setRecentEntries(entriesRes.data.data.entries);

        // Map breakdown to 7-day array (Mon-Sun)
        const breakdownMap = {};
        (breakdownRes.data.data.breakdown || []).forEach((d) => {
          breakdownMap[d.date] = d;
        });

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset + i);
          const key = d.toISOString().slice(0, 10);
          const isToday = d.toDateString() === today.toDateString();
          weekDays.push({
            label: DAY_LABELS[i],
            date: key,
            hours: (breakdownMap[key]?.netDuration || 0) / 3600,
            isToday,
          });
        }
        setWeeklyBreakdown(weekDays);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const todayTotal = (todaySummary?.netDuration || 0) + (hasActiveTimer ? netElapsed : 0);
  const weekTotal = (weekSummary?.netDuration || 0) + (hasActiveTimer ? netElapsed : 0);
  const todayPercent = Math.min((todayTotal / (8 * 3600)) * 100, 100);
  const weekPercent = Math.min((weekTotal / (40 * 3600)) * 100, 100);
  const maxBarHours = Math.max(8, ...weeklyBreakdown.map((d) => d.hours));
  const billablePercent = weekSummary?.netDuration
    ? Math.round((weekSummary.billableSeconds / weekSummary.netDuration) * 100)
    : 0;

  if (loading) {
    return (
      <div className="animate-fade-in-up">
        {/* Skeleton header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="h-7 w-56 bg-white/[0.06] rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-white/[0.04] rounded-md mt-2 animate-pulse" />
          </div>
          <div className="h-9 w-44 bg-white/[0.06] rounded-xl animate-pulse" />
        </div>
        {/* Skeleton stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[0.05] p-5 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/[0.06] rounded-xl animate-pulse" />
                <div>
                  <div className="h-6 w-20 bg-white/[0.06] rounded-md animate-pulse" />
                  <div className="h-3 w-24 bg-white/[0.04] rounded-md mt-2 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/[0.05] rounded-2xl border border-white/[0.08] h-72 animate-pulse" />
          <div className="bg-white/[0.05] rounded-2xl border border-white/[0.08] h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{greeting}, {user?.firstName}!</h1>
          <p className="text-white/35 text-[14px] mt-1">Here's an overview of your workspace.</p>
        </div>
        <div className="text-[13px] text-white/40 font-medium bg-white/[0.05] px-4 py-2 rounded-xl border border-white/[0.08] backdrop-blur-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Today */}
        <div className="relative overflow-hidden bg-white/[0.05] backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] group">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl shrink-0 border border-cyan-500/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white tabular-nums">{formatDuration(todayTotal)}</span>
              <span className="text-[12px] text-white/30 font-medium">Today · {Math.round(todayPercent)}% of 8h</span>
            </div>
          </div>
          {/* Progress underline */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.04]">
            <div className="h-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/40 transition-all duration-1000" style={{ width: `${todayPercent}%` }} />
          </div>
        </div>

        {/* This Week */}
        <div className="relative overflow-hidden bg-white/[0.05] backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 border border-emerald-500/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white tabular-nums">{formatDuration(weekTotal)}</span>
              <span className="text-[12px] text-white/30 font-medium">This Week · {Math.round(weekPercent)}% of 40h</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.04]">
            <div className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/40 transition-all duration-1000" style={{ width: `${weekPercent}%` }} />
          </div>
        </div>

        {/* Billable */}
        <div className="bg-white/[0.05] backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 border border-purple-500/15">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white tabular-nums">{billablePercent}%</span>
              <span className="text-[12px] text-white/30 font-medium">Billable Rate</span>
            </div>
          </div>
        </div>

        {/* Timer Status */}
        <div className={`bg-white/[0.05] backdrop-blur-xl p-5 rounded-2xl border transition-colors duration-300 ${
          isRunning
            ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
            : isPaused
              ? 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
              : 'border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 border ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                : isPaused
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                  : 'bg-white/[0.04] text-white/25 border-white/[0.06]'
            }`}>
              {isRunning ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              ) : isPaused ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-amber-400">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">
                {isRunning ? 'Active' : isPaused ? 'Paused' : 'Idle'}
              </span>
              <span className="text-[12px] text-white/30 font-medium">
                {hasActiveTimer ? formatDuration(netElapsed) : 'No timer'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: Weekly chart + Quick actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Hours Chart */}
        <div className="lg:col-span-2 bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[15px] font-semibold text-white">Weekly Hours</h3>
              <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">This Week</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white tabular-nums">{formatDuration(weekTotal)}</span>
              <span className="text-[11px] text-white/20">/</span>
              <span className="text-[13px] text-white/30 tabular-nums">40h 00m</span>
            </div>
          </div>
          <div className="p-6">
            {/* Bar chart */}
            <div className="flex items-end gap-3 h-44">
              {weeklyBreakdown.map((day) => {
                const barHeight = maxBarHours > 0 ? (day.hours / maxBarHours) * 100 : 0;
                const reachedTarget = day.hours >= 8;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    {/* Hours label */}
                    <span className={`text-[11px] tabular-nums font-medium ${
                      day.isToday ? 'text-cyan-400' : day.hours > 0 ? 'text-white/50' : 'text-white/15'
                    }`}>
                      {day.hours > 0 ? `${day.hours.toFixed(1)}h` : '—'}
                    </span>
                    {/* Bar */}
                    <div className="relative w-full flex-1 flex flex-col justify-end">
                      {/* 8h target line */}
                      <div
                        className="absolute left-0 right-0 border-t border-dashed border-white/[0.08]"
                        style={{ bottom: `${(8 / maxBarHours) * 100}%` }}
                      />
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                          day.isToday
                            ? reachedTarget
                              ? 'bg-gradient-to-t from-emerald-500/60 to-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                              : 'bg-gradient-to-t from-cyan-500/60 to-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                            : reachedTarget
                              ? 'bg-gradient-to-t from-emerald-500/30 to-emerald-400/15'
                              : day.hours > 0
                                ? 'bg-gradient-to-t from-white/[0.12] to-white/[0.06]'
                                : 'bg-white/[0.04]'
                        }`}
                        style={{ height: `${Math.max(barHeight, 2)}%` }}
                      />
                    </div>
                    {/* Day label */}
                    <span className={`text-[11px] font-semibold ${
                      day.isToday ? 'text-cyan-400' : 'text-white/25'
                    }`}>
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-cyan-500/50" />
                <span className="text-[11px] text-white/30 font-medium">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
                <span className="text-[11px] text-white/30 font-medium">Target Reached</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 border-t border-dashed border-white/20" />
                <span className="text-[11px] text-white/30 font-medium">8h Target</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions + Timer Status */}
        <div className="flex flex-col gap-6">
          {/* Quick Timer */}
          <div className={`bg-white/[0.05] backdrop-blur-xl rounded-2xl border overflow-hidden transition-colors duration-300 ${
            isRunning
              ? 'border-emerald-500/15'
              : isPaused
                ? 'border-amber-500/15'
                : 'border-white/[0.08]'
          }`}>
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-[15px] font-semibold text-white">Quick Timer</h3>
            </div>
            <div className="p-6 flex flex-col items-center">
              {/* Mini timer display */}
              <div className={`text-3xl font-bold tabular-nums mb-4 ${
                isRunning ? 'text-cyan-400 animate-text-glow' : isPaused ? 'text-amber-400 animate-text-glow-amber' : 'text-white/15'
              }`}>
                {hasActiveTimer ? formatDuration(netElapsed) : '0h 00m'}
              </div>

              {hasActiveTimer ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      isRunning ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                    }`} />
                    <span className={`text-[12px] font-semibold ${isRunning ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isRunning ? 'Timer Running' : 'Timer Paused'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/time-tracker')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white text-[13px] font-medium rounded-xl border border-white/[0.08] hover:border-white/[0.12] transition-all duration-200 cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    View Session
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/time-tracker')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white text-[13px] font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-0.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Start Tracking
                </button>
              )}
            </div>
          </div>

          {/* Daily Progress Ring */}
          <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-[15px] font-semibold text-white">Daily Progress</h3>
            </div>
            <div className="p-6 flex flex-col items-center">
              {/* Progress ring */}
              <div className="relative w-28 h-28 mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={todayPercent >= 100 ? 'rgba(16,185,129,0.6)' : 'rgba(6,182,212,0.5)'}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - todayPercent / 100)}
                    className="transition-all duration-1000"
                    style={{ filter: `drop-shadow(0 0 4px ${todayPercent >= 100 ? 'rgba(16,185,129,0.4)' : 'rgba(6,182,212,0.3)'})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white tabular-nums">{Math.round(todayPercent)}%</span>
                </div>
              </div>
              <span className="text-[12px] text-white/30 font-medium">
                {todayPercent >= 100 ? 'Target reached!' : `${formatDuration(Math.max(0, 8 * 3600 - todayTotal))} remaining`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Recent Activity + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-white">Recent Activity</h3>
            {recentEntries.length > 0 && (
              <Link to="/time-tracker" className="text-[12px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-150">
                View all
              </Link>
            )}
          </div>
          <div className="p-6">
            {recentEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-white/[0.04] rounded-xl flex items-center justify-center mb-3 border border-white/[0.06]">
                  <svg className="text-white/15" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <p className="text-[14px] font-medium text-white/40 mb-1">No activity yet</p>
                <span className="text-[12px] text-white/20">Start tracking time to see your activity here.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {recentEntries.map((entry) => {
                  const netDuration = Math.max(0, (entry.duration || 0) - (entry.totalBreakDuration || 0));
                  return (
                    <div key={entry._id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors duration-150 group">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                        entry.entryType === 'timer'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/15'
                      }`}>
                        {entry.entryType === 'timer' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-white/70 truncate group-hover:text-white/90 transition-colors duration-150">
                          {entry.description || 'No description'}
                        </p>
                        <p className="text-[11px] text-white/25">
                          {formatTime(entry.startTime)} — {entry.endTime ? formatTime(entry.endTime) : 'In progress'}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold text-white/50 tabular-nums group-hover:text-white/70 transition-colors duration-150">
                        {formatDuration(netDuration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-[15px] font-semibold text-white">Profile Information</h3>
          </div>
          <div className="p-6">
            {/* User avatar + name */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl text-white text-lg font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                {`${(user?.firstName || '')[0] || ''}${(user?.lastName || '')[0] || ''}`.toUpperCase()}
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-white">{user?.firstName} {user?.lastName}</h4>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-white/40 font-medium capitalize">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/35 font-medium">Email</span>
                <span className="text-[13px] text-white/70 font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/35 font-medium">Role</span>
                <span className="inline-flex px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold rounded-lg capitalize border border-cyan-500/15">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/35 font-medium">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold rounded-lg border border-emerald-500/15">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/35 font-medium">Entries</span>
                <span className="text-[13px] text-white/70 font-medium tabular-nums">{weekSummary?.entryCount || 0} this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
