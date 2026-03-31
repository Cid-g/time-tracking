import { createContext, useState, useCallback } from 'react';
import {
  listMySubmissionsApi,
  listPendingApprovalsApi,
  createSubmissionApi,
  submitSubmissionApi,
  reviewSubmissionApi,
  bulkSubmitApi,
  deleteSubmissionApi,
  getSubmissionApi,
} from '../api/submission.api';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const TimesheetContext = createContext(null);

export const TimesheetProvider = ({ children }) => {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [pendingPagination, setPendingPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);

  const loadSubmissions = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await listMySubmissionsApi(params);
      setSubmissions(data.data.submissions);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingApprovals = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await listPendingApprovalsApi(params);
      setPendingApprovals(data.data.submissions);
      setPendingPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubmission = useCallback(async (payload) => {
    const { data } = await createSubmissionApi(payload);
    toast.success('Submission draft created');
    return data.data.submission;
  }, []);

  const submitSubmission = useCallback(async (id) => {
    const { data } = await submitSubmissionApi(id);
    toast.success('Timesheet submitted for approval');
    return data.data.submission;
  }, []);

  const approveSubmission = useCallback(async (id, comment = '') => {
    const { data } = await reviewSubmissionApi(id, { action: 'approved', comment });
    toast.success('Timesheet approved');
    return data.data.submission;
  }, []);

  const rejectSubmission = useCallback(async (id, comment) => {
    const { data } = await reviewSubmissionApi(id, { action: 'rejected', comment });
    toast.success('Timesheet rejected');
    return data.data.submission;
  }, []);

  const bulkSubmit = useCallback(async (submissionIds) => {
    const { data } = await bulkSubmitApi(submissionIds);
    toast.success(`${data.data.count} timesheets submitted`);
    return data.data.submissions;
  }, []);

  const deleteSubmission = useCallback(async (id) => {
    await deleteSubmissionApi(id);
    toast.success('Draft deleted');
  }, []);

  const getSubmission = useCallback(async (id) => {
    const { data } = await getSubmissionApi(id);
    return data.data.submission;
  }, []);

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'superadmin';

  const value = {
    submissions,
    pendingApprovals,
    pagination,
    pendingPagination,
    loading,
    isManagerOrAdmin,
    loadSubmissions,
    loadPendingApprovals,
    createSubmission,
    submitSubmission,
    approveSubmission,
    rejectSubmission,
    bulkSubmit,
    deleteSubmission,
    getSubmission,
  };

  return (
    <TimesheetContext.Provider value={value}>
      {children}
    </TimesheetContext.Provider>
  );
};
