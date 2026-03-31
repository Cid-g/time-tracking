import { useState, useEffect, useCallback } from 'react';
import useAdmin from '../../hooks/useAdmin';
import DelegateModal from './DelegateModal';
import RejectionModal from '../timesheets/RejectionModal';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  submitted: { label: 'Pending', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-400' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0h 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatPeriod = (period) => {
  if (!period?.startDate || !period?.endDate) return '—';
  return `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`;
};

const ApprovalsHub = () => {
  const {
    approvals,
    approvalPagination,
    approvalsLoading,
    approvalHistory,
    historyPagination,
    loadApprovals,
    bulkApproval,
    delegateApproval,
    loadApprovalHistory,
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [delegatingSubmission, setDelegatingSubmission] = useState(null);
  const [rejectingSubmission, setRejectingSubmission] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApprovals = useCallback(
    (page = 1) => {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      loadApprovals(params);
    },
    [statusFilter, startDate, endDate, loadApprovals]
  );

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter, startDate, endDate]);

  const handleSelectAll = () => {
    const submitted = approvals.filter((a) => a.status === 'submitted');
    if (selectedIds.length === submitted.length && submitted.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submitted.map((a) => a._id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await bulkApproval({ action: 'approve', submissionIds: selectedIds });
      setSelectedIds([]);
      fetchApprovals(approvalPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleApprove = async (id) => {
    setActionLoading(true);
    try {
      await bulkApproval({ action: 'approve', submissionIds: [id] });
      fetchApprovals(approvalPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (comment) => {
    if (!rejectingSubmission) return;
    setActionLoading(true);
    try {
      await bulkApproval({
        action: 'reject',
        submissionIds: [rejectingSubmission._id],
        comment,
      });
      setRejectingSubmission(null);
      fetchApprovals(approvalPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkRejectPrompt = () => {
    if (selectedIds.length === 0) return;
    setRejectingSubmission({ _id: 'bulk', ids: selectedIds });
  };

  const handleBulkReject = async (comment) => {
    setActionLoading(true);
    try {
      await bulkApproval({
        action: 'reject',
        submissionIds: rejectingSubmission.ids || [rejectingSubmission._id],
        comment,
      });
      setSelectedIds([]);
      setRejectingSubmission(null);
      fetchApprovals(approvalPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelegate = async (delegateToId, comment) => {
    try {
      await delegateApproval(delegatingSubmission._id, { delegateToId, comment });
      setDelegatingSubmission(null);
      fetchApprovals(approvalPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delegate');
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadApprovalHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {['', 'submitted', 'approved', 'rejected'].map((val) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
              statusFilter === val
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'text-white/40 hover:bg-white/[0.04]'
            }`}
          >
            {val ? STATUS_CONFIG[val]?.label || val : 'All'}
          </button>
        ))}

        <div className="flex-1" />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[12px] text-white/70 outline-none"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[12px] text-white/70 outline-none"
        />

        <button
          onClick={toggleHistory}
          className={`px-3 py-1.5 text-[12px] font-medium border rounded-xl transition-all cursor-pointer ${
            showHistory
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              : 'text-white/40 bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]'
          }`}
        >
          {showHistory ? 'Hide History' : 'History'}
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
          <span className="text-[12px] text-cyan-400 font-medium">{selectedIds.length} selected</span>
          <button
            onClick={handleBulkApprove}
            disabled={actionLoading}
            className="px-3 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-40"
          >
            Approve All
          </button>
          <button
            onClick={handleBulkRejectPrompt}
            disabled={actionLoading}
            className="px-3 py-1 text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-40"
          >
            Reject All
          </button>
          <button onClick={() => setSelectedIds([])} className="px-3 py-1 text-[11px] text-white/30 hover:text-white/50 cursor-pointer">Clear</button>
        </div>
      )}

      {/* Approval History Panel */}
      {showHistory && (
        <div className="mb-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-[14px] font-semibold text-white/80 mb-3">Approval History</h3>
          {approvalHistory.length === 0 ? (
            <p className="text-[12px] text-white/25">No approval history yet</p>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {approvalHistory.map((log) => (
                <div key={log._id} className="flex items-center gap-3 px-3 py-2 bg-white/[0.03] rounded-lg text-[12px]">
                  <span className="text-white/25 shrink-0 w-[120px]">
                    {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                    log.action.includes('APPROVED') ? 'bg-emerald-500/10 text-emerald-400' :
                    log.action.includes('REJECTED') ? 'bg-red-500/10 text-red-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {log.action.replace('SUBMISSION_', '').replace('ADMIN_', '')}
                  </span>
                  <span className="text-white/50">
                    {log.user?.firstName} {log.user?.lastName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {approvalsLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 text-white/15">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-[14px] font-medium">No submissions found</p>
          <p className="text-[12px] text-white/20 mt-1">Adjust your filters to see results</p>
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[32px_1fr_140px_90px_130px_80px_180px] gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/25 mb-1">
            <span>
              <input
                type="checkbox"
                checked={selectedIds.length === approvals.filter((a) => a.status === 'submitted').length && selectedIds.length > 0}
                onChange={handleSelectAll}
                className="accent-cyan-500 cursor-pointer"
              />
            </span>
            <span>Submitter</span>
            <span>Period</span>
            <span>Hours</span>
            <span>Projects</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Rows */}
          <div className="space-y-1.5">
            {approvals.map((sub) => {
              const statusStyle = STATUS_CONFIG[sub.status] || STATUS_CONFIG.submitted;
              const initials = `${sub.user?.firstName?.[0] || ''}${sub.user?.lastName?.[0] || ''}`.toUpperCase();

              return (
                <div
                  key={sub._id}
                  className="grid grid-cols-1 md:grid-cols-[32px_1fr_140px_90px_130px_80px_180px] gap-3 items-center px-4 py-3 bg-white/[0.03] rounded-xl border border-white/[0.04] hover:bg-white/[0.05] transition-all"
                >
                  {/* Checkbox */}
                  <span>
                    {sub.status === 'submitted' ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sub._id)}
                        onChange={() => handleSelect(sub._id)}
                        className="accent-cyan-500 cursor-pointer"
                      />
                    ) : <span />}
                  </span>

                  {/* Submitter */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/70 to-purple-500/70 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-white/70 truncate">
                        {sub.user?.firstName} {sub.user?.lastName}
                      </p>
                      <p className="text-[11px] text-white/25 truncate">{sub.user?.email}</p>
                    </div>
                  </div>

                  {/* Period */}
                  <span className="text-[12px] text-white/50">{formatPeriod(sub.period)}</span>

                  {/* Hours */}
                  <span className="text-[12px] text-cyan-400/70 font-medium">{formatDuration(sub.totalDuration)}</span>

                  {/* Projects */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {sub.projectBreakdown?.slice(0, 2).map((pb, i) => (
                      <span key={i} className="flex items-center gap-1 text-[11px] text-white/40">
                        {pb.project && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pb.project.color || '#06b6d4' }} />
                        )}
                        {pb.project?.name || 'No Project'}
                      </span>
                    ))}
                    {(sub.projectBreakdown?.length || 0) > 2 && (
                      <span className="text-[10px] text-white/25">+{sub.projectBreakdown.length - 2}</span>
                    )}
                  </div>

                  {/* Status */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border w-fit ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {statusStyle.label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    {sub.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => handleSingleApprove(sub._id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 rounded-lg border border-emerald-500/20 transition-all cursor-pointer disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingSubmission(sub)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/15 rounded-lg border border-red-500/20 transition-all cursor-pointer disabled:opacity-40"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setDelegatingSubmission(sub)}
                          className="px-2.5 py-1 text-[11px] font-medium text-purple-400 bg-purple-500/10 hover:bg-purple-500/15 rounded-lg border border-purple-500/20 transition-all cursor-pointer"
                          title="Delegate to manager"
                        >
                          Delegate
                        </button>
                      </>
                    )}
                    {sub.status !== 'submitted' && sub.reviewedBy && (
                      <span className="text-[11px] text-white/25">
                        by {sub.reviewedBy.firstName} {sub.reviewedBy.lastName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {approvalPagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[...Array(Math.min(approvalPagination.pages, 10))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchApprovals(i + 1)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                    approvalPagination.page === i + 1
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

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={!!rejectingSubmission}
        onClose={() => setRejectingSubmission(null)}
        onReject={rejectingSubmission?.ids ? handleBulkReject : handleReject}
        loading={actionLoading}
      />

      {/* Delegate Modal */}
      {delegatingSubmission && (
        <DelegateModal
          submission={delegatingSubmission}
          onClose={() => setDelegatingSubmission(null)}
          onDelegate={handleDelegate}
        />
      )}
    </div>
  );
};

export default ApprovalsHub;
