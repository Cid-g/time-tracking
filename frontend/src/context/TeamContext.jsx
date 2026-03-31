import { createContext, useState, useCallback } from 'react';
import {
  getTeamStatsApi,
  listMembersApi,
  getMemberApi,
  updateMemberRoleApi,
  updateMemberStatusApi,
  inviteMemberApi,
  getActivityFeedApi,
  getLiveStatusApi,
  getTeamTimesheetsApi,
  approveTeamTimesheetApi,
  rejectTeamTimesheetApi,
  getHoursBreakdownApi,
  getProjectDistributionApi,
  getWeeklyTrendsApi,
} from '../api/team.api';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await getTeamStatsApi();
      setStats(data.data.stats);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load team stats');
    }
  }, []);

  const loadMembers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await listMembersApi(params);
      setMembers(data.data.members);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  const getMember = useCallback(async (id) => {
    const { data } = await getMemberApi(id);
    return data.data.member;
  }, []);

  const updateRole = useCallback(async (id, role) => {
    const { data } = await updateMemberRoleApi(id, role);
    toast.success('Role updated successfully');
    return data.data.member;
  }, []);

  const updateStatus = useCallback(async (id, isActive) => {
    const { data } = await updateMemberStatusApi(id, isActive);
    toast.success(isActive ? 'Member activated' : 'Member deactivated');
    return data.data.member;
  }, []);

  const inviteMember = useCallback(async (payload) => {
    const { data } = await inviteMemberApi(payload);
    toast.success(`Invitation sent to ${payload.email}`);
    return data.data.member;
  }, []);

  // Phase 6B
  const [activity, setActivity] = useState([]);
  const [activityPagination, setActivityPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [activityLoading, setActivityLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState([]);
  const [teamTimesheets, setTeamTimesheets] = useState([]);
  const [timesheetPagination, setTimesheetPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);

  const loadActivityFeed = useCallback(async (params = {}) => {
    setActivityLoading(true);
    try {
      const { data } = await getActivityFeedApi(params);
      setActivity(data.data.entries);
      setActivityPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load activity feed');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const loadLiveStatus = useCallback(async () => {
    try {
      const { data } = await getLiveStatusApi();
      setLiveStatus(data.data.activeMembers);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load live status');
    }
  }, []);

  const loadTeamTimesheets = useCallback(async (params = {}) => {
    setTimesheetsLoading(true);
    try {
      const { data } = await getTeamTimesheetsApi(params);
      setTeamTimesheets(data.data.submissions);
      setTimesheetPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load team timesheets');
    } finally {
      setTimesheetsLoading(false);
    }
  }, []);

  const approveTimesheet = useCallback(async (id) => {
    const { data } = await approveTeamTimesheetApi(id);
    toast.success('Timesheet approved');
    return data.data.submission;
  }, []);

  const rejectTimesheet = useCallback(async (id, comment) => {
    const { data } = await rejectTeamTimesheetApi(id, comment);
    toast.success('Timesheet rejected');
    return data.data.submission;
  }, []);

  // Phase 6C
  const [analytics, setAnalytics] = useState({
    hoursBreakdown: [],
    projectDistribution: [],
    weeklyTrends: [],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadHoursBreakdown = useCallback(async (params) => {
    setAnalyticsLoading(true);
    try {
      const { data } = await getHoursBreakdownApi(params);
      setAnalytics((prev) => ({ ...prev, hoursBreakdown: data.data.breakdown }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load hours breakdown');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadProjectDistribution = useCallback(async (params) => {
    try {
      const { data } = await getProjectDistributionApi(params);
      setAnalytics((prev) => ({ ...prev, projectDistribution: data.data.distribution }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project distribution');
    }
  }, []);

  const loadWeeklyTrends = useCallback(async (params = {}) => {
    try {
      const { data } = await getWeeklyTrendsApi(params);
      setAnalytics((prev) => ({ ...prev, weeklyTrends: data.data.trends }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load weekly trends');
    }
  }, []);

  const isManagerOrAdmin =
    user?.role === 'manager' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const value = {
    members,
    stats,
    pagination,
    loading,
    isManagerOrAdmin,
    isSuperAdmin,
    loadStats,
    loadMembers,
    getMember,
    updateRole,
    updateStatus,
    inviteMember,
    // 6B
    activity,
    activityPagination,
    activityLoading,
    liveStatus,
    teamTimesheets,
    timesheetPagination,
    timesheetsLoading,
    loadActivityFeed,
    loadLiveStatus,
    loadTeamTimesheets,
    approveTimesheet,
    rejectTimesheet,
    // 6C
    analytics,
    analyticsLoading,
    loadHoursBreakdown,
    loadProjectDistribution,
    loadWeeklyTrends,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};
