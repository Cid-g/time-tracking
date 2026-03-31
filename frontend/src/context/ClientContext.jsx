import { createContext, useState, useCallback } from 'react';
import {
  getClientDashboardApi,
  listClientProjectsApi,
  getClientProjectDetailApi,
  getClientProjectReportApi,
  exportClientProjectReportApi,
} from '../api/client.api';
import toast from 'react-hot-toast';

export const ClientContext = createContext(null);

export const ClientProvider = ({ children }) => {
  // =============================================
  // Dashboard
  // =============================================
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const { data } = await getClientDashboardApi();
      setDashboard(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // =============================================
  // Projects List
  // =============================================
  const [projects, setProjects] = useState([]);
  const [projectsPagination, setProjectsPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [projectsLoading, setProjectsLoading] = useState(false);

  const loadProjects = useCallback(async (params = {}) => {
    setProjectsLoading(true);
    try {
      const { data } = await listClientProjectsApi(params);
      setProjects(data.data.projects);
      setProjectsPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // =============================================
  // Project Detail (local to caller)
  // =============================================
  const getProjectDetail = useCallback(async (id) => {
    const { data } = await getClientProjectDetailApi(id);
    return data.data;
  }, []);

  // =============================================
  // Reports
  // =============================================
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const loadReport = useCallback(async (id, params) => {
    setReportLoading(true);
    try {
      const { data } = await getClientProjectReportApi(id, params);
      setReport(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report');
    } finally {
      setReportLoading(false);
    }
  }, []);

  const exportReport = useCallback(async (id, params) => {
    try {
      const response = await exportClientProjectReportApi(id, params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'project-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    }
  }, []);

  const value = {
    // Dashboard
    dashboard,
    dashboardLoading,
    loadDashboard,
    // Projects
    projects,
    projectsPagination,
    projectsLoading,
    loadProjects,
    getProjectDetail,
    // Reports
    report,
    reportLoading,
    loadReport,
    exportReport,
  };

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};
