import { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import useClient from '../../hooks/useClient';
import ClientDashboardTab from '../../components/client/ClientDashboardTab';
import ClientProjectsTab from '../../components/client/ClientProjectsTab';
import ClientReportTab from '../../components/client/ClientReportTab';

const TABS = [
  { key: 'dashboard', label: 'Overview' },
  { key: 'projects', label: 'Projects' },
  { key: 'reports', label: 'Reports' },
];

const ClientPortalPage = () => {
  const { user } = useAuth();
  const { dashboard, dashboardLoading, loadDashboard, loadProjects } = useClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'projects') {
      loadProjects();
    }
  }, [activeTab, loadDashboard, loadProjects]);

  // Role guard
  if (user?.role !== 'client' && user?.role !== 'superadmin') {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-5 border border-red-500/15">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/35 text-[15px]">This section is restricted to Clients.</p>
      </div>
    );
  }

  const stats = dashboard?.stats;

  const statCards = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects || 0,
      color: 'purple',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      label: 'Hours Tracked',
      value: stats?.totalHoursTracked || 0,
      color: 'cyan',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Budget Used',
      value: stats?.totalBudgetHours ? `${stats.budgetUsedHours}h / ${stats.totalBudgetHours}h` : '0',
      color: 'amber',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Active Projects',
      value: stats?.activeProjects || 0,
      color: 'emerald',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
  ];

  const colorMap = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/15', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/15', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
  };

  const handleViewProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab('reports');
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Client Portal</h1>
            <p className="text-white/35 text-[14px] mt-0.5">Project overview, time tracking, and reports</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div
              key={card.label}
              className={`bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-5 ${c.shadow}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-xl flex items-center justify-center border ${c.border}`}>
                  {card.icon}
                </div>
                <span className="text-white/40 text-[13px] font-medium">{card.label}</span>
              </div>
              <p className={`text-3xl font-bold ${c.text}`}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <ClientDashboardTab onViewProject={handleViewProject} />
      )}
      {activeTab === 'projects' && (
        <ClientProjectsTab onViewReport={handleViewProject} />
      )}
      {activeTab === 'reports' && (
        <ClientReportTab preselectedProjectId={selectedProjectId} />
      )}
    </div>
  );
};

export default ClientPortalPage;
