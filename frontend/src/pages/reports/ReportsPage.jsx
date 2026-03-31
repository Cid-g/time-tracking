import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import ProductivityTrendsTab from '../../components/reports/ProductivityTrendsTab';
import ActivityLevelsTab from '../../components/reports/ActivityLevelsTab';
import AppUsageTab from '../../components/reports/AppUsageTab';

const TABS = [
  { key: 'productivity', label: 'Productivity Trends' },
  { key: 'activity', label: 'Activity Levels' },
  { key: 'appUsage', label: 'App & Website Usage' },
];

const ReportsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('productivity');

  if (user?.role !== 'superadmin') {
    return (
      <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mb-5 border border-red-500/15">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/35 text-[14px]">Reports & Analytics is available to Super Admins only.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/15 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
            <p className="text-white/35 text-[14px] mt-0.5">Cross-team productivity metrics, activity analysis, and app usage</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-cyan-500/15 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'productivity' && <ProductivityTrendsTab />}
      {activeTab === 'activity' && <ActivityLevelsTab />}
      {activeTab === 'appUsage' && <AppUsageTab />}
    </div>
  );
};

export default ReportsPage;
