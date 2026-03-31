import { createContext, useState, useCallback } from 'react';
import {
  getAdminTimesheetsApi,
  editAdminTimeEntryApi,
  exportAdminTimesheetsApi,
  runComplianceCheckApi,
  bulkTimesheetActionApi,
  getAdminApprovalsApi,
  bulkApprovalActionApi,
  delegateApprovalApi,
  getApprovalHistoryApi,
  getAuditLogsApi,
  getAuditLogDetailApi,
  exportAuditLogsApi,
  detectAnomaliesApi,
} from '../api/admin.api';
import toast from 'react-hot-toast';

export const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  // =============================================
  // Module 25: Timesheet Explorer
  // =============================================
  const [timesheets, setTimesheets] = useState([]);
  const [timesheetPagination, setTimesheetPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);
  const [complianceResults, setComplianceResults] = useState(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const loadTimesheets = useCallback(async (params = {}) => {
    setTimesheetsLoading(true);
    try {
      const { data } = await getAdminTimesheetsApi(params);
      setTimesheets(data.data.entries);
      setTimesheetPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load timesheets');
    } finally {
      setTimesheetsLoading(false);
    }
  }, []);

  const editTimeEntry = useCallback(async (id, updates, reason) => {
    const { data } = await editAdminTimeEntryApi(id, { updates, reason });
    toast.success('Time entry updated');
    return data.data.entry;
  }, []);

  const exportTimesheets = useCallback(async (params) => {
    try {
      const response = await exportAdminTimesheetsApi(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timesheets-export.${params.format || 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export timesheets');
    }
  }, []);

  const runCompliance = useCallback(async (data) => {
    setComplianceLoading(true);
    try {
      const response = await runComplianceCheckApi(data);
      setComplianceResults(response.data.data);
      toast.success(`Compliance check complete: ${response.data.data.summary.totalViolations} violation(s) found`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run compliance check');
    } finally {
      setComplianceLoading(false);
    }
  }, []);

  const bulkTimesheetAction = useCallback(async (data) => {
    const response = await bulkTimesheetActionApi(data);
    toast.success(`${response.data.data.modified} entries ${data.action === 'flag' ? 'flagged' : 'unflagged'}`);
    return response.data.data;
  }, []);

  // =============================================
  // Module 26: Approvals Hub
  // =============================================
  const [approvals, setApprovals] = useState([]);
  const [approvalPagination, setApprovalPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const loadApprovals = useCallback(async (params = {}) => {
    setApprovalsLoading(true);
    try {
      const { data } = await getAdminApprovalsApi(params);
      setApprovals(data.data.submissions);
      setApprovalPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load approvals');
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  const bulkApproval = useCallback(async (data) => {
    const response = await bulkApprovalActionApi(data);
    toast.success(`${response.data.data.processed} submission(s) ${data.action === 'approve' ? 'approved' : 'rejected'}`);
    return response.data.data;
  }, []);

  const delegateApproval = useCallback(async (id, data) => {
    const response = await delegateApprovalApi(id, data);
    toast.success('Submission delegated successfully');
    return response.data.data.submission;
  }, []);

  const loadApprovalHistory = useCallback(async (params = {}) => {
    try {
      const { data } = await getApprovalHistoryApi(params);
      setApprovalHistory(data.data.logs);
      setHistoryPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load approval history');
    }
  }, []);

  // =============================================
  // Module 27: Audit Trail
  // =============================================
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [anomaliesLoading, setAnomaliesLoading] = useState(false);

  const loadAuditLogs = useCallback(async (params = {}) => {
    setAuditLoading(true);
    try {
      const { data } = await getAuditLogsApi(params);
      setAuditLogs(data.data.logs);
      setAuditPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const getAuditDetail = useCallback(async (id) => {
    const { data } = await getAuditLogDetailApi(id);
    setSelectedAuditLog(data.data.log);
    return data.data.log;
  }, []);

  const exportAuditLogs = useCallback(async (params) => {
    try {
      const response = await exportAuditLogsApi(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-export.${params.format || 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to export audit logs');
    }
  }, []);

  const loadAnomalies = useCallback(async (params) => {
    setAnomaliesLoading(true);
    try {
      const { data } = await detectAnomaliesApi(params);
      setAnomalies(data.data);
      toast.success(`Anomaly scan complete: ${data.data.summary.total} anomalies detected`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to detect anomalies');
    } finally {
      setAnomaliesLoading(false);
    }
  }, []);

  const value = {
    // Module 25: Timesheet Explorer
    timesheets,
    timesheetPagination,
    timesheetsLoading,
    complianceResults,
    complianceLoading,
    loadTimesheets,
    editTimeEntry,
    exportTimesheets,
    runCompliance,
    bulkTimesheetAction,
    // Module 26: Approvals Hub
    approvals,
    approvalPagination,
    approvalsLoading,
    approvalHistory,
    historyPagination,
    loadApprovals,
    bulkApproval,
    delegateApproval,
    loadApprovalHistory,
    // Module 27: Audit Trail
    auditLogs,
    auditPagination,
    auditLoading,
    selectedAuditLog,
    setSelectedAuditLog,
    anomalies,
    anomaliesLoading,
    loadAuditLogs,
    getAuditDetail,
    exportAuditLogs,
    loadAnomalies,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
