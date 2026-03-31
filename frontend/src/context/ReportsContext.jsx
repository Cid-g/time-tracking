import { createContext, useState, useCallback } from 'react';
import {
  getProductivityTrendsApi,
  exportProductivityTrendsApi,
  getActivityLevelsApi,
  getActivityHeatmapApi,
  getAppUsageApi,
} from '../api/reports.api';
import toast from 'react-hot-toast';

export const ReportsContext = createContext(null);

export const ReportsProvider = ({ children }) => {
  // =============================================
  // Module 28: Productivity Trends
  // =============================================
  const [productivityTrends, setProductivityTrends] = useState(null);
  const [productivityLoading, setProductivityLoading] = useState(false);

  const loadProductivityTrends = useCallback(async (params) => {
    setProductivityLoading(true);
    try {
      const { data } = await getProductivityTrendsApi(params);
      setProductivityTrends(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load productivity trends');
    } finally {
      setProductivityLoading(false);
    }
  }, []);

  const exportProductivity = useCallback(async (params) => {
    try {
      const response = await exportProductivityTrendsApi(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `productivity-trends.${params.format || 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export');
    }
  }, []);

  // =============================================
  // Module 29: Activity Levels
  // =============================================
  const [activityLevels, setActivityLevels] = useState(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);

  const loadActivityLevels = useCallback(async (params) => {
    setActivityLoading(true);
    try {
      const { data } = await getActivityLevelsApi(params);
      setActivityLevels(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load activity levels');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const loadHeatmap = useCallback(async (params) => {
    setHeatmapLoading(true);
    try {
      const { data } = await getActivityHeatmapApi(params);
      setHeatmapData(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load heatmap');
    } finally {
      setHeatmapLoading(false);
    }
  }, []);

  // =============================================
  // Module 30: App & Website Usage
  // =============================================
  const [appUsage, setAppUsage] = useState(null);
  const [appUsageLoading, setAppUsageLoading] = useState(false);

  const loadAppUsage = useCallback(async (params) => {
    setAppUsageLoading(true);
    try {
      const { data } = await getAppUsageApi(params);
      setAppUsage(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load app usage');
    } finally {
      setAppUsageLoading(false);
    }
  }, []);

  const value = {
    // Productivity Trends
    productivityTrends, productivityLoading, loadProductivityTrends, exportProductivity,
    // Activity Levels
    activityLevels, activityLoading, loadActivityLevels,
    heatmapData, heatmapLoading, loadHeatmap,
    // App Usage
    appUsage, appUsageLoading, loadAppUsage,
  };

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};
