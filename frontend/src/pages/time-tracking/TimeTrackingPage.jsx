import { useState, useEffect, useCallback } from 'react';
import useTimeTracking from '../../hooks/useTimeTracking';
import Timer from '../../components/time-tracking/Timer';
import ActivityTimeline from '../../components/time-tracking/ActivityTimeline';
import ManualEntryModal from '../../components/time-tracking/ManualEntryModal';
import TimeEntriesList from '../../components/time-tracking/TimeEntriesList';
import { getTimeSummaryApi } from '../../api/timeEntry.api';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 00m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
};

const TimeTrackingPage = () => {
  const { hasActiveTimer, activeEntry, netElapsed, isRunning, isPaused } = useTimeTracking();
  const [showManualModal, setShowManualModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [todaySummary, setTodaySummary] = useState(null);
  const [weekSummary, setWeekSummary] = useState(null);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset).toISOString();

        const [todayRes, weekRes] = await Promise.all([
          getTimeSummaryApi({ startDate: todayStart, endDate: todayEnd }),
          getTimeSummaryApi({ startDate: weekStart, endDate: todayEnd }),
        ]);

        setTodaySummary(todayRes.data.data.summary);
        setWeekSummary(weekRes.data.data.summary);
      } catch {
        // Silently fail
      }
    };

    fetchSummaries();
  }, [refreshKey]);

  // Today's total including active timer
  const todayTotal = (todaySummary?.netDuration || 0) + (hasActiveTimer ? netElapsed : 0);
  const weekTotal = (weekSummary?.netDuration || 0) + (hasActiveTimer ? netElapsed : 0);
  const todayPercent = Math.min((todayTotal / (8 * 3600)) * 100, 100);

  return (
    <div className="animate-fade-in-up">
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Time Tracking</h1>
          <p className="text-white/35 text-[14px] mt-1">Track your hours and manage time entries.</p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-[13px] font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:-translate-y-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Manual Entry
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Today */}
        <div className="relative overflow-hidden bg-white/[0.05] backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl shrink-0 border border-cyan-500/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-white tabular-nums">{formatDuration(todayTotal)}</span>
              <p className="text-[11px] text-white/30 font-medium">Today</p>
            </div>
          </div>
          {/* Subtle progress underline */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/[0.04]">
            <div className="h-full bg-gradient-to-r from-cyan-500/60 to-cyan-400/40 transition-all duration-1000" style={{ width: `${todayPercent}%` }} />
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white/[0.05] backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 border border-emerald-500/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-white tabular-nums">{formatDuration(weekTotal)}</span>
              <p className="text-[11px] text-white/30 font-medium">This Week</p>
            </div>
          </div>
        </div>

        {/* Entries */}
        <div className="bg-white/[0.05] backdrop-blur-xl p-4 rounded-2xl border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 border border-purple-500/15">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-white tabular-nums">{weekSummary?.entryCount || 0}</span>
              <p className="text-[11px] text-white/30 font-medium">Entries</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={`bg-white/[0.05] backdrop-blur-xl p-4 rounded-2xl border transition-colors duration-300 ${
          isRunning
            ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
            : isPaused
              ? 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
              : 'border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 border ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                : isPaused
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                  : 'bg-white/[0.04] text-white/25 border-white/[0.06]'
            }`}>
              {isRunning ? (
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              ) : isPaused ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-amber-400">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              )}
            </div>
            <div>
              <span className="text-lg font-bold text-white">
                {isRunning ? 'Active' : isPaused ? 'Paused' : 'Idle'}
              </span>
              <p className="text-[11px] text-white/30 font-medium">
                {hasActiveTimer ? formatDuration(netElapsed) : 'No timer'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: Timer + Activity Timeline side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
        {/* Timer - takes 2 columns */}
        <div className="xl:col-span-2">
          <Timer onTimerStop={triggerRefresh} />
        </div>

        {/* Right panel: Activity Timeline + Session Info */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          {/* Activity Timeline */}
          <ActivityTimeline
            refreshKey={refreshKey}
            activeEntry={activeEntry}
            netElapsed={netElapsed}
          />

          {/* Session context card (when timer is active) */}
          {hasActiveTimer && (
            <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[15px] font-semibold text-white">Current Session</h3>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${
                      isRunning
                        ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                        : 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                    }`} />
                    <span className="text-[14px] font-semibold text-white">
                      {isRunning ? 'Tracking' : 'Paused'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Started At</span>
                  <span className="text-[14px] font-semibold text-white">
                    {new Date(activeEntry.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Description</span>
                  <span className="text-[14px] text-white/70 truncate">
                    {activeEntry.description || '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-white/25 uppercase tracking-wider">Billable</span>
                  <span className={`text-[14px] font-semibold ${activeEntry.isBillable ? 'text-emerald-400' : 'text-white/40'}`}>
                    {activeEntry.isBillable ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session History */}
      <TimeEntriesList refreshKey={refreshKey} />

      <ManualEntryModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onEntryCreated={triggerRefresh}
      />
    </div>
  );
};

export default TimeTrackingPage;
