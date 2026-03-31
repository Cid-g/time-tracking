import { createContext, useState, useCallback } from 'react';
import {
  getProductivityScoreApi,
  getPeerComparisonApi,
  getActivityHeatmapApi,
  getTopAppsApi,
  getBreakAnalyticsApi,
  getBreakRecommendationsApi,
  getBreakSettingsApi,
  updateBreakSettingsApi,
} from '../api/member.api';
import toast from 'react-hot-toast';

export const MemberActivityContext = createContext(null);

export const MemberActivityProvider = ({ children }) => {
  // Module 6: Productivity Pulse
  const [productivityScore, setProductivityScore] = useState(null);
  const [productivityLoading, setProductivityLoading] = useState(false);
  const [peerComparison, setPeerComparison] = useState(null);
  const [peerLoading, setPeerLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [topApps, setTopApps] = useState(null);
  const [appsLoading, setAppsLoading] = useState(false);

  // Module 7: Break Analytics
  const [breakAnalytics, setBreakAnalytics] = useState(null);
  const [breakAnalyticsLoading, setBreakAnalyticsLoading] = useState(false);
  const [breakRecommendations, setBreakRecommendations] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [breakSettings, setBreakSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Productivity loaders
  const loadProductivityScore = useCallback(async (period = '7d') => {
    setProductivityLoading(true);
    try {
      const { data } = await getProductivityScoreApi({ period });
      setProductivityScore(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load productivity score');
    } finally {
      setProductivityLoading(false);
    }
  }, []);

  const loadPeerComparison = useCallback(async (period = '7d') => {
    setPeerLoading(true);
    try {
      const { data } = await getPeerComparisonApi({ period });
      setPeerComparison(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load peer comparison');
    } finally {
      setPeerLoading(false);
    }
  }, []);

  const loadHeatmap = useCallback(async (period = '7d') => {
    setHeatmapLoading(true);
    try {
      const { data } = await getActivityHeatmapApi({ period });
      setHeatmapData(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load activity heatmap');
    } finally {
      setHeatmapLoading(false);
    }
  }, []);

  const loadTopApps = useCallback(async (period = '7d', limit = 10) => {
    setAppsLoading(true);
    try {
      const { data } = await getTopAppsApi({ period, limit });
      setTopApps(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load top apps');
    } finally {
      setAppsLoading(false);
    }
  }, []);

  // Break Analytics loaders
  const loadBreakAnalytics = useCallback(async (period = '7d') => {
    setBreakAnalyticsLoading(true);
    try {
      const { data } = await getBreakAnalyticsApi({ period });
      setBreakAnalytics(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load break analytics');
    } finally {
      setBreakAnalyticsLoading(false);
    }
  }, []);

  const loadBreakRecommendations = useCallback(async (period = '7d') => {
    setRecommendationsLoading(true);
    try {
      const { data } = await getBreakRecommendationsApi({ period });
      setBreakRecommendations(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  const loadBreakSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const { data } = await getBreakSettingsApi();
      setBreakSettings(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load break settings');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates) => {
    try {
      const { data } = await updateBreakSettingsApi(updates);
      setBreakSettings(data.data);
      toast.success('Break settings saved');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
      return false;
    }
  }, []);

  const value = {
    // Productivity
    productivityScore, productivityLoading, loadProductivityScore,
    peerComparison, peerLoading, loadPeerComparison,
    heatmapData, heatmapLoading, loadHeatmap,
    topApps, appsLoading, loadTopApps,
    // Breaks
    breakAnalytics, breakAnalyticsLoading, loadBreakAnalytics,
    breakRecommendations, recommendationsLoading, loadBreakRecommendations,
    breakSettings, settingsLoading, loadBreakSettings,
    updateSettings,
  };

  return (
    <MemberActivityContext.Provider value={value}>
      {children}
    </MemberActivityContext.Provider>
  );
};
