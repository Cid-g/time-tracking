import { useState, useEffect, useCallback } from 'react';
import useTeam from '../../hooks/useTeam';
import useAuth from '../../hooks/useAuth';
import MemberCard from '../../components/team/MemberCard';
import MemberDetailModal from '../../components/team/MemberDetailModal';
import InviteMemberModal from '../../components/team/InviteMemberModal';
import LiveStatusPanel from '../../components/team/LiveStatusPanel';
import ActivityFeed from '../../components/team/ActivityFeed';
import TeamTimesheetTable from '../../components/team/TeamTimesheetTable';
import AnalyticsTab from '../../components/team/AnalyticsTab';
import RejectionModal from '../../components/timesheets/RejectionModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'members', label: 'Members' },
  { key: 'activity', label: 'Activity' },
  { key: 'timesheets', label: 'Timesheets' },
  { key: 'analytics', label: 'Analytics' },
];

const ROLE_FILTERS = [
  { value: '', label: 'All Roles' },
  { value: 'member', label: 'Member' },
  { value: 'manager', label: 'Manager' },
  { value: 'client', label: 'Client' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const TIMESHEET_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const TeamPage = () => {
  const { user } = useAuth();
  const {
    members,
    stats,
    pagination,
    loading,
    isSuperAdmin,
    loadMembers,
    loadStats,
    updateStatus,
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
  } = useTeam();

  const [activeTab, setActiveTab] = useState('members');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timesheetStatusFilter, setTimesheetStatusFilter] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [detailMemberId, setDetailMemberId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Members tab
  const fetchMembers = useCallback(
    (page = 1) => {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      loadMembers(params);
    },
    [search, roleFilter, statusFilter, loadMembers]
  );

  // Activity tab
  const fetchActivity = useCallback(
    (page = 1) => {
      loadActivityFeed({ page, limit: 20 });
    },
    [loadActivityFeed]
  );

  // Timesheets tab
  const fetchTimesheets = useCallback(
    (page = 1) => {
      const params = { page, limit: 10 };
      if (timesheetStatusFilter) params.status = timesheetStatusFilter;
      loadTeamTimesheets(params);
    },
    [timesheetStatusFilter, loadTeamTimesheets]
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers(1);
  }, [activeTab, fetchMembers]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivity(1);
      loadLiveStatus();
    }
  }, [activeTab, fetchActivity, loadLiveStatus]);

  useEffect(() => {
    if (activeTab === 'timesheets') fetchTimesheets(1);
  }, [activeTab, fetchTimesheets]);

  const handleStatusToggle = (memberId, isActive) => {
    const member = members.find((m) => m._id === memberId);
    setConfirmAction({
      memberId,
      isActive,
      name: `${member?.firstName || ''} ${member?.lastName || ''}`.trim(),
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await updateStatus(confirmAction.memberId, confirmAction.isActive);
      fetchMembers(pagination.page);
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleApproveTimesheet = async (id) => {
    setActionLoading(true);
    try {
      await approveTimesheet(id);
      fetchTimesheets(timesheetPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTimesheet = async (reason) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await rejectTimesheet(rejectTarget._id, reason);
      fetchTimesheets(timesheetPagination.page);
      setRejectTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    fetchMembers(1);
    loadStats();
  };

  const handleDetailRefresh = () => {
    fetchMembers(pagination.page);
    loadStats();
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-[14px] text-white/35 mt-1">
            Manage your team members, activity, timesheets, and analytics
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Members', value: stats.totalMembers, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color: 'cyan' },
            { label: 'Active Now', value: stats.activeNow, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color: 'emerald' },
            { label: 'Hours This Week', value: formatDuration(stats.totalHoursThisWeek), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, color: 'purple' },
            { label: 'Avg Hours/Member', value: formatDuration(stats.avgHoursPerMember), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, color: 'amber' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-white/35 font-medium uppercase tracking-wider">{stat.label}</span>
                <div className={`text-${stat.color}-400/50`}>{stat.icon}</div>
              </div>
              <p className={`text-[22px] font-bold text-${stat.color}-400`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 w-fit mb-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== MEMBERS TAB ==================== */}
      {activeTab === 'members' && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-10 pr-3.5 py-2.5 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 transition-all"
              />
            </div>

            <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
              {ROLE_FILTERS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRoleFilter(opt.value)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
                    roleFilter === opt.value ? 'bg-cyan-500/15 text-cyan-400' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
              {STATUS_FILTERS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
                    statusFilter === opt.value ? 'bg-cyan-500/15 text-cyan-400' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Members Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] h-48 animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/30">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-white/15">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p className="text-[15px] font-medium">No team members found</p>
              <p className="text-[13px] text-white/20 mt-1">
                {search || roleFilter || statusFilter ? 'Try adjusting your filters' : 'Invite your first team member to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map((member) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  onViewDetail={(id) => setDetailMemberId(id)}
                  onStatusToggle={handleStatusToggle}
                  isSuperAdmin={isSuperAdmin}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchMembers(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                    pagination.page === i + 1 ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== ACTIVITY TAB ==================== */}
      {activeTab === 'activity' && (
        <>
          <LiveStatusPanel activeMembers={liveStatus} />
          <ActivityFeed
            entries={activity}
            pagination={activityPagination}
            onPageChange={(page) => fetchActivity(page)}
            loading={activityLoading}
          />
        </>
      )}

      {/* ==================== TIMESHEETS TAB ==================== */}
      {activeTab === 'timesheets' && (
        <>
          {/* Status filter */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 w-fit mb-5">
            {TIMESHEET_STATUS_FILTERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimesheetStatusFilter(opt.value)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
                  timesheetStatusFilter === opt.value ? 'bg-cyan-500/15 text-cyan-400' : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <TeamTimesheetTable
            submissions={teamTimesheets}
            pagination={timesheetPagination}
            onPageChange={(page) => fetchTimesheets(page)}
            loading={timesheetsLoading}
            onApprove={handleApproveTimesheet}
            onReject={(sub) => setRejectTarget(sub)}
            actionLoading={actionLoading}
          />
        </>
      )}

      {/* ==================== ANALYTICS TAB ==================== */}
      {activeTab === 'analytics' && <AnalyticsTab />}

      {/* Modals */}
      <MemberDetailModal
        isOpen={!!detailMemberId}
        onClose={() => setDetailMemberId(null)}
        memberId={detailMemberId}
        onRefresh={handleDetailRefresh}
        isSuperAdmin={isSuperAdmin}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
      />

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmStatusChange}
        title={confirmAction?.isActive ? 'Activate Member' : 'Deactivate Member'}
        message={`Are you sure you want to ${
          confirmAction?.isActive ? 'activate' : 'deactivate'
        } ${confirmAction?.name || 'this member'}? ${
          confirmAction?.isActive
            ? 'They will be able to log in and track time again.'
            : 'They will no longer be able to log in or track time.'
        }`}
        confirmText={confirmAction?.isActive ? 'Activate' : 'Deactivate'}
        loading={actionLoading}
      />

      <RejectionModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onReject={handleRejectTimesheet}
        loading={rejectLoading}
      />
    </div>
  );
};

export default TeamPage;
