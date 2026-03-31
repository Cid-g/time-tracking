import { useState, useEffect, useCallback } from 'react';
import useAdmin from '../../hooks/useAdmin';
import useAuth from '../../hooks/useAuth';
import TimesheetExplorer from '../../components/admin/TimesheetExplorer';
import ApprovalsHub from '../../components/admin/ApprovalsHub';
import AuditTrail from '../../components/admin/AuditTrail';

const TABS = [
  { key: 'timesheets', label: 'Timesheet Explorer' },
  { key: 'approvals', label: 'Approvals Hub' },
  { key: 'audit', label: 'Audit Trail' },
];

const AdminPage = () => {
  const { user } = useAuth();
  const {
    timesheetPagination,
    approvalPagination,
    auditPagination,
    loadTimesheets,
    loadApprovals,
    loadAuditLogs,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('timesheets');

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'timesheets') {
      loadTimesheets();
    } else if (activeTab === 'approvals') {
      loadApprovals();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab, loadTimesheets, loadApprovals, loadAuditLogs]);

  // Redirect non-superadmin
  if (user?.role !== 'superadmin') {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-5 border border-red-500/15">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/35 text-[15px]">This section is restricted to Super Admins.</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Entries',
      value: timesheetPagination.total,
      color: 'cyan',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Pending Approvals',
      value: approvalPagination.total,
      color: 'amber',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: 'Audit Events',
      value: auditPagination.total,
      color: 'purple',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
  ];

  const colorMap = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/15', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/15', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center border border-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Time Management</h1>
            <p className="text-white/35 text-[14px] mt-0.5">Admin oversight for timesheets, approvals, and audit trail</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <p className={`text-3xl font-bold ${c.text}`}>{card.value.toLocaleString()}</p>
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
                ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'timesheets' && <TimesheetExplorer />}
      {activeTab === 'approvals' && <ApprovalsHub />}
      {activeTab === 'audit' && <AuditTrail />}
    </div>
  );
};

export default AdminPage;
