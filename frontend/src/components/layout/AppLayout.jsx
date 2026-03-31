import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useTimeTracking from '../../hooks/useTimeTracking';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { hasActiveTimer, isRunning } = useTimeTracking();
  const [collapsed, setCollapsed] = useState(false);

  const getInitials = (first, last) => {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
  };

  return (
    <div className="flex min-h-screen">
      <aside className={`flex flex-col bg-white/[0.03] backdrop-blur-xl border-r border-white/[0.06] text-white shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}>
        {/* Logo */}
        <div className={`py-6 border-b border-white/[0.06] ${collapsed ? 'px-0 flex justify-center' : 'px-5'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-cyan-500/15 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                WorkPulse
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto py-5 flex flex-col gap-6 ${collapsed ? 'px-2' : 'px-3'}`}>
          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">Overview</span>
            )}
            <nav className="flex flex-col gap-0.5">
              <NavLink
                to="/dashboard"
                title="Dashboard"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    )}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <rect width="7" height="9" x="3" y="3" rx="1"/>
                      <rect width="7" height="5" x="14" y="3" rx="1"/>
                      <rect width="7" height="9" x="14" y="12" rx="1"/>
                      <rect width="7" height="5" x="3" y="16" rx="1"/>
                    </svg>
                    {!collapsed && <span>Dashboard</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">Track</span>
            )}
            <nav className="flex flex-col gap-0.5">
              <NavLink
                to="/time-tracker"
                title="Time Tracking"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    )}
                    <div className="relative shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {hasActiveTimer && (
                        <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
                          isRunning
                            ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                            : 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                        }`} />
                      )}
                    </div>
                    {!collapsed && <span>Time Tracking</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">Manage</span>
            )}
            <nav className="flex flex-col gap-0.5">
              <NavLink
                to="/projects"
                title="Projects"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    )}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {!collapsed && <span>Projects</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">Workspace</span>
            )}
            <nav className="flex flex-col gap-0.5">
              {/* Timesheets */}
              <NavLink
                to="/timesheets"
                title="Timesheets"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {!collapsed && <span>Timesheets</span>}
                  </>
                )}
              </NavLink>

              {/* Team */}
              <NavLink
                to="/team"
                title="Team"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {!collapsed && <span>Team</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">Analytics</span>
            )}
            <nav className="flex flex-col gap-0.5">
              {/* Reports */}
              <NavLink
                to="/reports"
                title="Reports"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    {!collapsed && <span>Reports</span>}
                  </>
                )}
              </NavLink>

              {/* Activity */}
              <NavLink
                to="/activity"
                title="Activity"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    {!collapsed && <span>Activity</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          {user?.role === 'superadmin' && (
          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">Admin</span>
            )}
            <nav className="flex flex-col gap-0.5">
              <NavLink
                to="/admin"
                title="Time Management"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    {!collapsed && <span>Time Management</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>
          )}

          {(user?.role === 'client' || user?.role === 'superadmin') && (
          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">Client</span>
            )}
            <nav className="flex flex-col gap-0.5">
              <NavLink
                to="/client-portal"
                title="Client Portal"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-400 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    {!collapsed && <span>Client Portal</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>
          )}

          <div>
            {!collapsed && (
              <span className="px-3 text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-2 block">System</span>
            )}
            <nav className="flex flex-col gap-0.5">
              {/* Settings */}
              <NavLink
                to="/settings"
                title="Settings"
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                    {!collapsed && <span>Settings</span>}
                  </>
                )}
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Collapse toggle */}
        <div className={`px-3 py-2 border-t border-white/[0.06] ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-white/25 hover:bg-white/[0.05] hover:text-white/50 transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center w-full' : 'w-full'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            >
              <polyline points="11 17 6 12 11 7"/>
              <polyline points="18 17 13 12 18 7"/>
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Footer / User Card */}
        <div className={`py-4 border-t border-white/[0.06] ${collapsed ? 'px-2' : 'px-3'}`}>
          {collapsed ? (
            /* Collapsed: just avatar */
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg text-white text-[13px] font-bold shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-default" title={`${user?.firstName} ${user?.lastName}`}>
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <button
                onClick={logout}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-white/25 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer"
                title="Log out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          ) : (
            /* Expanded: full user card */
            <>
              <div className="flex items-center gap-3 px-2 mb-3">
                <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg text-white text-[13px] font-bold shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold text-white/90 truncate">{user?.firstName} {user?.lastName}</span>
                  <span className="text-[11px] text-white/30 capitalize">{user?.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Log out</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
