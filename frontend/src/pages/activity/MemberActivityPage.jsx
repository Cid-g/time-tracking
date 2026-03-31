import { useState } from 'react';
import ProductivityPulseTab from '../../components/member/ProductivityPulseTab';
import BreakAnalyticsTab from '../../components/member/BreakAnalyticsTab';

const TABS = [
  { key: 'productivity', label: 'Productivity Pulse' },
  { key: 'breaks', label: 'Break Analytics' },
];

const MemberActivityPage = () => {
  const [activeTab, setActiveTab] = useState('productivity');

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Focus Dashboard</h1>
          <p className="text-[12px] text-white/30">Productivity insights and break analytics</p>
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
      {activeTab === 'productivity' && <ProductivityPulseTab />}
      {activeTab === 'breaks' && <BreakAnalyticsTab />}
    </div>
  );
};

export default MemberActivityPage;
