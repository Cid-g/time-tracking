import { useState, useEffect, useCallback } from 'react';
import useTeam from '../../hooks/useTeam';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  member: { label: 'Member', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  manager: { label: 'Manager', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  superadmin: { label: 'Super Admin', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  client: { label: 'Client', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
};

const ROLE_OPTIONS = ['member', 'manager', 'client'];

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MemberDetailModal = ({ isOpen, onClose, memberId, onRefresh, isSuperAdmin }) => {
  const { getMember, updateRole, updateStatus } = useTeam();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const loadMember = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const data = await getMember(memberId);
      setMember(data);
      setSelectedRole(data.role);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load member details');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [memberId, getMember, onClose]);

  useEffect(() => {
    if (isOpen && memberId) {
      loadMember();
    }
    if (!isOpen) {
      setMember(null);
      setSelectedRole('');
    }
  }, [isOpen, memberId, loadMember]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === member.role) return;
    setActionLoading(true);
    try {
      await updateRole(memberId, selectedRole);
      await loadMember();
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    setActionLoading(true);
    try {
      await updateStatus(memberId, !member.isActive);
      await loadMember();
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/[0.08] animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">Member Details</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading || !member ? (
          <div className="p-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6">
            {/* Profile header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[18px] font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                  {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase()}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                    member.isOnline
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse'
                      : 'bg-white/20'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-bold text-white">
                  {member.firstName} {member.lastName}
                </h2>
                <p className="text-[13px] text-white/40 mt-0.5">{member.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {(() => {
                    const rs = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                    return (
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${rs.bg} ${rs.text} ${rs.border}`}>
                        {rs.label}
                      </span>
                    );
                  })()}
                  <span className={`flex items-center gap-1 text-[11px] font-medium ${member.isOnline ? 'text-emerald-400' : 'text-white/30'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.isOnline ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    {member.isOnline ? 'Online' : 'Offline'}
                  </span>
                  {!member.isActive && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-[11px] text-white/25 shrink-0">
                <p>Joined {formatDate(member.createdAt)}</p>
                {member.lastLoginAt && <p>Last login {formatDate(member.lastLoginAt)}</p>}
              </div>
            </div>

            {/* Active timer */}
            {member.isOnline && member.activeTimer && (
              <div className="px-4 py-3 bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl mb-5">
                <p className="text-[12px] text-emerald-400 font-semibold mb-0.5">Currently Working</p>
                <p className="text-[13px] text-white/70">
                  {member.activeTimer.project?.name || 'No project'}
                  {member.activeTimer.task?.title && ` · ${member.activeTimer.task.title}`}
                </p>
                {member.activeTimer.description && (
                  <p className="text-[12px] text-white/35 mt-0.5">{member.activeTimer.description}</p>
                )}
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Hours This Week', value: formatDuration(member.stats?.hoursThisWeek), color: 'cyan' },
                { label: 'Hours This Month', value: formatDuration(member.stats?.hoursThisMonth), color: 'purple' },
                { label: 'Entries This Week', value: member.stats?.entriesThisWeek || 0, color: 'emerald' },
                { label: 'Projects', value: member.stats?.projectsCount || 0, color: 'amber' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.04] rounded-xl border border-white/[0.06] p-3.5 text-center">
                  <p className="text-[11px] text-white/35 font-medium mb-1">{stat.label}</p>
                  <p className={`text-[18px] font-bold text-${stat.color}-400`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Assigned Projects */}
            {member.assignedProjects?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[13px] font-semibold text-white/60 mb-2.5">Assigned Projects</h4>
                <div className="flex flex-wrap gap-2">
                  {member.assignedProjects.map((project) => (
                    <div
                      key={project._id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: project.color || '#06b6d4' }}
                      />
                      <span className="text-[12px] text-white/60 font-medium">{project.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Time Entries */}
            {member.recentEntries?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[13px] font-semibold text-white/60 mb-2.5">Recent Time Entries</h4>
                <div className="space-y-1.5">
                  {member.recentEntries.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.04]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-white/60 truncate">
                          {entry.description || 'No description'}
                        </p>
                        <p className="text-[11px] text-white/25 mt-0.5">
                          {entry.project?.name || 'No project'}
                          {entry.task?.title && ` · ${entry.task.title}`}
                          {' · '}
                          {formatDate(entry.startTime)} {formatTime(entry.startTime)}
                        </p>
                      </div>
                      <span className="text-[12px] text-cyan-400/70 font-medium shrink-0">
                        {formatDuration(entry.duration - (entry.totalBreakDuration || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-2 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 transition-all cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRoleChange}
                      disabled={actionLoading || selectedRole === member.role}
                      className="px-3.5 py-2 text-[12px] font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 rounded-xl border border-cyan-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      ) : (
                        'Update Role'
                      )}
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-medium text-white/60 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl border border-white/[0.08] transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleStatusToggle}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-[13px] font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
                    member.isActive
                      ? 'text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20'
                  }`}
                >
                  {member.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDetailModal;
