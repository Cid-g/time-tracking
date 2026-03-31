import { useState } from 'react';

const ROLE_CONFIG = {
  member: {
    label: 'Member',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  manager: {
    label: 'Manager',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  superadmin: {
    label: 'Super Admin',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  client: {
    label: 'Client',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const MemberCard = ({ member, onViewDetail, onStatusToggle, isSuperAdmin, currentUserId }) => {
  const [hovered, setHovered] = useState(false);
  const roleStyle = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
  const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();
  const isSelf = member._id === currentUserId;

  return (
    <div
      className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-200 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-[14px] font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            {initials}
          </div>
          {/* Online indicator */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f1423] ${
              member.isOnline
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse'
                : 'bg-white/20'
            }`}
          />
        </div>

        {/* Name + Role */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-white truncate">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-[12px] text-white/35 truncate mt-0.5">{member.email}</p>
        </div>

        {/* Role badge */}
        <span
          className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
        >
          {roleStyle.label}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/25">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[12px] text-white/50 font-medium">
            {formatDuration(member.hoursThisWeek)}
            <span className="text-white/25 ml-1">this week</span>
          </span>
        </div>
        {!member.isActive && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
            Inactive
          </span>
        )}
      </div>

      {/* Active timer info */}
      {member.isOnline && member.activeTimer && (
        <div className="px-3 py-2 bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl mb-3">
          <p className="text-[11px] text-emerald-400/80 font-medium truncate">
            {member.activeTimer.project?.name || 'No project'}
            {member.activeTimer.task?.title && ` · ${member.activeTimer.task.title}`}
          </p>
          {member.activeTimer.description && (
            <p className="text-[11px] text-white/30 truncate mt-0.5">
              {member.activeTimer.description}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        className={`flex items-center gap-2 pt-3 border-t border-white/[0.06] transition-opacity duration-200 ${
          hovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={() => onViewDetail(member._id)}
          className="px-3 py-1.5 text-[12px] font-medium text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all cursor-pointer"
        >
          View Details
        </button>
        {!isSelf && onStatusToggle && (
          <button
            onClick={() => onStatusToggle(member._id, !member.isActive)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
              member.isActive
                ? 'text-white/50 hover:text-red-400 hover:bg-red-500/10'
                : 'text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            {member.isActive ? 'Deactivate' : 'Activate'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MemberCard;
