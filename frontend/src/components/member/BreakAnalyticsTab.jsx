import { useState, useEffect, useCallback } from 'react';
import useMemberActivity from '../../hooks/useMemberActivity';

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '30d', label: '30 Days' },
];

const SEVERITY_STYLES = {
  high: { bg: 'bg-red-500/5', border: 'border-red-500/10', icon: 'text-red-400', iconBg: 'bg-red-500/10' },
  medium: { bg: 'bg-amber-500/5', border: 'border-amber-500/10', icon: 'text-amber-400', iconBg: 'bg-amber-500/10' },
  low: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/10', icon: 'text-cyan-400', iconBg: 'bg-cyan-500/10' },
  info: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/10', icon: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
};

const formatSeconds = (s) => {
  if (!s || s <= 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const BreakAnalyticsTab = () => {
  const {
    breakAnalytics, breakAnalyticsLoading, loadBreakAnalytics,
    breakRecommendations, recommendationsLoading, loadBreakRecommendations,
    breakSettings, settingsLoading, loadBreakSettings,
    updateSettings,
  } = useMemberActivity();

  const [period, setPeriod] = useState('7d');
  const [localSettings, setLocalSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    loadBreakAnalytics(period);
    loadBreakRecommendations(period);
    loadBreakSettings();
  }, [period, loadBreakAnalytics, loadBreakRecommendations, loadBreakSettings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync localSettings with context
  useEffect(() => {
    if (breakSettings) {
      setLocalSettings({ ...breakSettings });
    }
  }, [breakSettings]);

  const handleSaveSettings = async () => {
    if (!localSettings) return;
    setSaving(true);
    await updateSettings(localSettings);
    setSaving(false);
  };

  const loading = breakAnalyticsLoading || recommendationsLoading;
  const summary = breakAnalytics?.summary || {};
  const dailyPattern = breakAnalytics?.dailyPattern || [];
  const timing = breakAnalytics?.timingDistribution || { morning: 0, afternoon: 0, evening: 0 };
  const recommendations = breakRecommendations?.recommendations || [];

  const totalTimingBreaks = timing.morning + timing.afternoon + timing.evening || 1;
  const maxDailyBreaks = dailyPattern.length > 0 ? Math.max(...dailyPattern.map((d) => d.breakCount), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
              period === p.value
                ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : !breakAnalytics ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-[14px] font-medium">No break data available</p>
          <p className="text-[12px] text-white/20 mt-1">Start tracking time to see break analytics</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg Breaks/Day', value: summary.avgBreaksPerDay || 0, color: 'cyan' },
              { label: 'Avg Duration', value: formatSeconds(summary.avgBreakDurationSeconds), color: 'purple' },
              { label: 'Total Break Time', value: formatSeconds(summary.totalBreakTimeSeconds), color: 'emerald' },
              { label: 'Longest No-Break', value: `${summary.longestNoBreakMinutes || 0}m`, color: 'amber' },
            ].map((card) => (
              <div key={card.label} className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-4 text-center">
                <p className="text-[11px] text-white/30 font-medium mb-1">{card.label}</p>
                <p className={`text-[20px] font-bold text-${card.color}-400`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Break Timing Distribution */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-[14px] font-semibold text-white mb-4">Break Timing Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'Morning', sublabel: 'Before 12 PM', count: timing.morning, color: 'from-cyan-500/60 to-cyan-400/40', text: 'text-cyan-400' },
                { label: 'Afternoon', sublabel: '12 PM - 5 PM', count: timing.afternoon, color: 'from-purple-500/60 to-purple-400/40', text: 'text-purple-400' },
                { label: 'Evening', sublabel: 'After 5 PM', count: timing.evening, color: 'from-emerald-500/60 to-emerald-400/40', text: 'text-emerald-400' },
              ].map((slot) => {
                const pct = totalTimingBreaks > 0 ? (slot.count / totalTimingBreaks) * 100 : 0;
                return (
                  <div key={slot.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-medium ${slot.text}`}>{slot.label}</span>
                        <span className="text-[11px] text-white/20">{slot.sublabel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-white/50">{slot.count} breaks</span>
                        <span className="text-[11px] text-white/25">{Math.round(pct)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${slot.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Break Pattern */}
          {dailyPattern.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Daily Break Pattern</h3>
              <div className="flex items-end gap-1.5 h-32">
                {dailyPattern.map((day) => {
                  const heightPct = maxDailyBreaks > 0 ? (day.breakCount / maxDailyBreaks) * 100 : 0;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                      <span className="text-[9px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.breakCount} ({formatSeconds(day.totalBreakSeconds)})
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-300 bg-purple-500/40 hover:opacity-80"
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="text-[8px] text-white/15 font-mono truncate w-full text-center">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Gap breaks summary */}
              {(summary.totalGapBreaks > 0) && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-4">
                  <span className="text-[11px] text-white/25">
                    {summary.totalGapBreaks} between-session gaps detected (avg {summary.avgGapDurationMinutes}m)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Recommendations</h3>
              <div className="space-y-3">
                {recommendations.map((rec, i) => {
                  const style = SEVERITY_STYLES[rec.severity] || SEVERITY_STYLES.info;
                  return (
                    <div key={i} className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-3`}>
                      <div className={`w-8 h-8 ${style.iconBg} ${style.icon} rounded-lg flex-shrink-0 flex items-center justify-center`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {rec.severity === 'info' ? (
                            <><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/></>
                          ) : (
                            <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white/80">{rec.title}</p>
                        <p className="text-[12px] text-white/40 mt-0.5">{rec.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Break Settings */}
          {localSettings && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-[14px] font-semibold text-white mb-4">Break Preferences</h3>
              <div className="space-y-5">
                {/* Enabled toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-white/80 font-medium">Break Reminders</p>
                    <p className="text-[11px] text-white/30">Get nudges when you work too long without a break</p>
                  </div>
                  <button
                    onClick={() => setLocalSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${
                      localSettings.enabled ? 'bg-cyan-500/40' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                      localSettings.enabled ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Break interval slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] text-white/80 font-medium">Break Interval</p>
                    <span className="text-[13px] text-cyan-400 font-mono font-semibold">{localSettings.breakInterval} min</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={120}
                    step={5}
                    value={localSettings.breakInterval}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, breakInterval: +e.target.value }))}
                    className="w-full h-1.5 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-cyan-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/15">30 min</span>
                    <span className="text-[10px] text-white/15">120 min</span>
                  </div>
                </div>

                {/* Break duration slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] text-white/80 font-medium">Break Duration</p>
                    <span className="text-[13px] text-purple-400 font-mono font-semibold">{localSettings.breakDuration} min</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={localSettings.breakDuration}
                    onChange={(e) => setLocalSettings((prev) => ({ ...prev, breakDuration: +e.target.value }))}
                    className="w-full h-1.5 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-purple-500 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/15">1 min</span>
                    <span className="text-[10px] text-white/15">15 min</span>
                  </div>
                </div>

                {/* Mode toggle */}
                <div>
                  <p className="text-[13px] text-white/80 font-medium mb-2">Reminder Mode</p>
                  <div className="flex gap-2">
                    {['flexible', 'strict'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setLocalSettings((prev) => ({ ...prev, mode }))}
                        className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                          localSettings.mode === mode
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                            : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/20 mt-1.5">
                    {localSettings.mode === 'strict'
                      ? 'Strict: Persistent reminders until you take a break'
                      : 'Flexible: Gentle nudges that can be dismissed'}
                  </p>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveSettings}
                  disabled={saving || settingsLoading}
                  className="w-full py-2.5 bg-cyan-500/15 text-cyan-400 rounded-xl text-[13px] font-semibold hover:bg-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-500/15 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BreakAnalyticsTab;
