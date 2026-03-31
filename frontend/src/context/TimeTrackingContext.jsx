import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  startTimerApi,
  stopTimerApi,
  pauseTimerApi,
  resumeTimerApi,
  getActiveTimerApi,
} from '../api/timeEntry.api';
import useAuth from '../hooks/useAuth';

export const TimeTrackingContext = createContext(null);

export const TimeTrackingProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activeEntry, setActiveEntry] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const tickRef = useRef(null);

  /**
   * Calculate elapsed seconds from entry data.
   */
  const calcElapsed = useCallback((entry) => {
    if (!entry?.startTime) return 0;
    const start = new Date(entry.startTime).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1000);
  }, []);

  /**
   * Calculate total break seconds, including any open break.
   */
  const calcBreakElapsed = useCallback((entry) => {
    if (!entry?.breaks?.length) return 0;
    return entry.breaks.reduce((total, brk) => {
      const bStart = new Date(brk.startedAt).getTime();
      const bEnd = brk.endedAt ? new Date(brk.endedAt).getTime() : Date.now();
      return total + Math.floor((bEnd - bStart) / 1000);
    }, 0);
  }, []);

  /**
   * Start the client-side tick interval (updates every second).
   */
  const startTick = useCallback(
    (entry) => {
      if (tickRef.current) clearInterval(tickRef.current);

      tickRef.current = setInterval(() => {
        setElapsed(calcElapsed(entry));
        setBreakElapsed(calcBreakElapsed(entry));
      }, 1000);
    },
    [calcElapsed, calcBreakElapsed]
  );

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  /**
   * Apply server entry to local state, handling status transitions.
   */
  const applyEntry = useCallback(
    (entry) => {
      if (!entry) {
        // Timer was stopped externally
        stopTick();
        setActiveEntry(null);
        setElapsed(0);
        setBreakElapsed(0);
        return;
      }

      setActiveEntry(entry);
      setElapsed(calcElapsed(entry));
      setBreakElapsed(calcBreakElapsed(entry));

      if (entry.status === 'running') {
        startTick(entry);
      } else {
        stopTick();
      }
    },
    [calcElapsed, calcBreakElapsed, startTick, stopTick]
  );

  /**
   * Restore active timer on mount + poll every 5s for cross-device sync.
   */
  const pollRef = useRef(null);
  const activeEntryRef = useRef(activeEntry);
  activeEntryRef.current = activeEntry;

  useEffect(() => {
    if (!isAuthenticated) return;

    const syncTimer = async () => {
      try {
        const { data } = await getActiveTimerApi();
        const serverEntry = data.data.entry || null;
        const local = activeEntryRef.current;

        // Detect if something changed externally
        const localId = local?._id;
        const serverId = serverEntry?._id;
        const localStatus = local?.status;
        const serverStatus = serverEntry?.status;
        const localBreaks = local?.breaks?.length || 0;
        const serverBreaks = serverEntry?.breaks?.length || 0;

        const changed =
          localId !== serverId ||
          localStatus !== serverStatus ||
          localBreaks !== serverBreaks;

        if (changed) {
          applyEntry(serverEntry);
        }
      } catch {
        // Network error — keep current state
      }
    };

    // Initial fetch
    syncTimer();

    // Poll every 5 seconds for cross-device changes
    pollRef.current = setInterval(syncTimer, 5000);

    return () => {
      stopTick();
      clearInterval(pollRef.current);
    };
  }, [isAuthenticated, applyEntry, stopTick]);

  const startTimer = useCallback(
    async (payload = {}) => {
      setLoading(true);
      try {
        const { data } = await startTimerApi(payload);
        const entry = data.data.entry;
        setActiveEntry(entry);
        setElapsed(0);
        setBreakElapsed(0);
        startTick(entry);
        return entry;
      } finally {
        setLoading(false);
      }
    },
    [startTick]
  );

  const stopTimer = useCallback(async () => {
    if (!activeEntry) return null;
    setLoading(true);
    try {
      const { data } = await stopTimerApi(activeEntry._id);
      stopTick();
      setActiveEntry(null);
      setElapsed(0);
      setBreakElapsed(0);
      return data.data.entry;
    } finally {
      setLoading(false);
    }
  }, [activeEntry, stopTick]);

  const pauseTimer = useCallback(async () => {
    if (!activeEntry) return null;
    setLoading(true);
    try {
      const { data } = await pauseTimerApi(activeEntry._id);
      const entry = data.data.entry;
      stopTick(); // Stop ticking when paused
      setActiveEntry(entry);
      setElapsed(calcElapsed(entry));
      setBreakElapsed(calcBreakElapsed(entry));
      return entry;
    } finally {
      setLoading(false);
    }
  }, [activeEntry, stopTick, calcElapsed, calcBreakElapsed]);

  const resumeTimer = useCallback(async () => {
    if (!activeEntry) return null;
    setLoading(true);
    try {
      const { data } = await resumeTimerApi(activeEntry._id);
      const entry = data.data.entry;
      setActiveEntry(entry);
      setElapsed(calcElapsed(entry));
      setBreakElapsed(calcBreakElapsed(entry));
      startTick(entry);
      return entry;
    } finally {
      setLoading(false);
    }
  }, [activeEntry, startTick, calcElapsed, calcBreakElapsed]);

  const value = {
    activeEntry,
    elapsed,
    breakElapsed,
    netElapsed: elapsed - breakElapsed,
    isRunning: activeEntry?.status === 'running',
    isPaused: activeEntry?.status === 'paused',
    hasActiveTimer: !!activeEntry,
    loading,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
};
