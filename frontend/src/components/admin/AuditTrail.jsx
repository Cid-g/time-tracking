import { useState, useEffect, useCallback } from 'react';
import useAdmin from '../../hooks/useAdmin';
import AuditDetailModal from './AuditDetailModal';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  LOGIN_SUCCESS: 'text-emerald-400 bg-emerald-500/10',
  LOGIN_FAILED: 'text-red-400 bg-red-500/10',
  REGISTER: 'text-cyan-400 bg-cyan-500/10',
  LOGOUT: 'text-white/50 bg-white/[0.06]',
  TOKEN_REFRESH: 'text-white/40 bg-white/[0.04]',
  ROLE_CHANGED: 'text-purple-400 bg-purple-500/10',
  PASSWORD_RESET_REQUEST: 'text-amber-400 bg-amber-500/10',
  PASSWORD_RESET_SUCCESS: 'text-emerald-400 bg-emerald-500/10',
  ACCOUNT_LOCKED: 'text-red-400 bg-red-500/10',
  TIME_ENTRY_CREATED: 'text-cyan-400 bg-cyan-500/10',
  TIME_ENTRY_UPDATED: 'text-amber-400 bg-amber-500/10',
  TIME_ENTRY_DELETED: 'text-red-400 bg-red-500/10',
  SUBMISSION_SUBMITTED: 'text-cyan-400 bg-cyan-500/10',
  SUBMISSION_APPROVED: 'text-emerald-400 bg-emerald-500/10',
  SUBMISSION_REJECTED: 'text-red-400 bg-red-500/10',
  SUBMISSION_DELEGATED: 'text-purple-400 bg-purple-500/10',
  ADMIN_TIME_ENTRY_EDITED: 'text-amber-400 bg-amber-500/10',
  ADMIN_BULK_ACTION: 'text-purple-400 bg-purple-500/10',
  ADMIN_DELEGATION: 'text-purple-400 bg-purple-500/10',
};

const ALL_ACTIONS = Object.keys(ACTION_COLORS);

const TARGET_TYPES = ['TimeEntry', 'Submission', 'User', 'Project'];

const SEVERITY_CONFIG = {
  high: { label: 'HIGH', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  medium: { label: 'MEDIUM', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  low: { label: 'LOW', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
};

const AuditTrail = () => {
  const {
    auditLogs,
    auditPagination,
    auditLoading,
    selectedAuditLog,
    setSelectedAuditLog,
    anomalies,
    anomaliesLoading,
    loadAuditLogs,
    getAuditDetail,
    exportAuditLogs,
    loadAnomalies,
  } = useAdmin();

  const [actionFilter, setActionFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAnomalies, setShowAnomalies] = useState(false);

  const fetchLogs = useCallback(
    (page = 1) => {
      const params = { page };
      if (actionFilter) params.action = actionFilter;
      if (targetFilter) params.targetType = targetFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      loadAuditLogs(params);
    },
    [actionFilter, targetFilter, startDate, endDate, loadAuditLogs]
  );

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, targetFilter, startDate, endDate]);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error('Select a date range to export');
      return;
    }
    await exportAuditLogs({ startDate, endDate, format: 'csv' });
  };

  const handleAnomalyScan = async () => {
    if (!startDate || !endDate) {
      toast.error('Select a date range for anomaly detection');
      return;
    }
    await loadAnomalies({ startDate, endDate });
    setShowAnomalies(true);
  };

  const handleRowClick = async (log) => {
    await getAuditDetail(log._id);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[12px] text-white/70 outline-none cursor-pointer appearance-none min-w-[160px]"
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[12px] text-white/70 outline-none cursor-pointer appearance-none min-w-[120px]"
        >
          <option value="">All Targets</option>
          {TARGET_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[12px] text-white/70 outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[12px] text-white/70 outline-none"
        />

        <button
          onClick={handleExport}
          className="px-3 py-2 text-[12px] font-medium text-white/50 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
        >
          Export CSV
        </button>

        <button
          onClick={handleAnomalyScan}
          disabled={anomaliesLoading}
          className="px-3 py-2 text-[12px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-40"
        >
          {anomaliesLoading ? 'Scanning...' : 'Detect Anomalies'}
        </button>
      </div>

      {/* Anomalies Panel */}
      {showAnomalies && anomalies && (
        <div className="mb-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-white/80">Anomaly Detection Results</h3>
            <button onClick={() => setShowAnomalies(false)} className="text-white/25 hover:text-white/50 cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Total Anomalies</p>
              <p className="text-xl font-bold text-red-400">{anomalies.summary.total}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Failed Logins</p>
              <p className="text-xl font-bold text-red-400">{anomalies.summary.failedLogins}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Mass Modifications</p>
              <p className="text-xl font-bold text-amber-400">{anomalies.summary.massModifications}</p>
            </div>
            <div className="bg-white/[0.04] rounded-xl p-3">
              <p className="text-[11px] text-white/30 mb-1">Off-Hours Activity</p>
              <p className="text-xl font-bold text-cyan-400">{anomalies.summary.offHoursActivity}</p>
            </div>
          </div>

          {/* Anomaly List */}
          {anomalies.anomalies.length > 0 && (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {anomalies.anomalies.map((a, i) => {
                const sev = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low;
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg text-[12px]">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${sev.color}`}>
                      {sev.label}
                    </span>
                    <span className="text-white/60 font-medium">{a.userName}</span>
                    <span className="text-white/30">{a.category?.replace(/_/g, ' ')}</span>
                    <span className="text-cyan-400/70 ml-auto">{a.count} occurrences</span>
                  </div>
                );
              })}
            </div>
          )}

          {anomalies.anomalies.length === 0 && (
            <p className="text-[12px] text-emerald-400/60 text-center py-3">No anomalies detected in the selected period</p>
          )}
        </div>
      )}

      {/* Loading */}
      {auditLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl h-12 animate-pulse" />
          ))}
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 text-white/15">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <p className="text-[14px] font-medium">No audit logs found</p>
          <p className="text-[12px] text-white/20 mt-1">Adjust your filters to see results</p>
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[160px_160px_1fr_120px_100px_90px] gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/25 mb-1">
            <span>Timestamp</span>
            <span>Action</span>
            <span>User</span>
            <span>Target</span>
            <span>IP Address</span>
            <span />
          </div>

          {/* Rows */}
          <div className="space-y-1.5">
            {auditLogs.map((log) => {
              const actionColor = ACTION_COLORS[log.action] || 'text-white/50 bg-white/[0.06]';

              return (
                <div
                  key={log._id}
                  onClick={() => handleRowClick(log)}
                  className="grid grid-cols-1 md:grid-cols-[160px_160px_1fr_120px_100px_90px] gap-3 items-center px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  {/* Timestamp */}
                  <span className="text-[12px] text-white/40">
                    {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                    <span className="text-white/25">
                      {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </span>

                  {/* Action */}
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md w-fit ${actionColor}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>

                  {/* User */}
                  <span className="text-[12px] text-white/50">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                  </span>

                  {/* Target */}
                  <span className="text-[11px] text-white/30">
                    {log.target?.type || '—'}
                  </span>

                  {/* IP */}
                  <span className="text-[11px] text-white/20 font-mono">{log.ipAddress || '—'}</span>

                  {/* Detail indicator */}
                  <span className="text-white/15 text-right">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {auditPagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[...Array(Math.min(auditPagination.pages, 10))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchLogs(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                    auditPagination.page === i + 1
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                      : 'text-white/40 hover:bg-white/[0.06]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedAuditLog && (
        <AuditDetailModal
          log={selectedAuditLog}
          onClose={() => setSelectedAuditLog(null)}
        />
      )}
    </div>
  );
};

export default AuditTrail;
