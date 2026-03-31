import { useState, useEffect, useCallback } from 'react';
import useTimesheet from '../../hooks/useTimesheet';
import SubmissionCard from '../../components/timesheets/SubmissionCard';
import CreateSubmissionModal from '../../components/timesheets/CreateSubmissionModal';
import SubmissionDetailModal from '../../components/timesheets/SubmissionDetailModal';
import RejectionModal from '../../components/timesheets/RejectionModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const TimesheetsPage = () => {
  const {
    submissions,
    pendingApprovals,
    pagination,
    pendingPagination,
    loading,
    isManagerOrAdmin,
    loadSubmissions,
    loadPendingApprovals,
    createSubmission,
    submitSubmission,
    approveSubmission,
    rejectSubmission,
    bulkSubmit,
    deleteSubmission,
    getSubmission,
  } = useTimesheet();

  const [activeTab, setActiveTab] = useState('my');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDrafts, setSelectedDrafts] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'my') {
      const params = { page: 1, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      loadSubmissions(params);
    } else {
      loadPendingApprovals({ page: 1, limit: 10 });
    }
  }, [activeTab, statusFilter, loadSubmissions, loadPendingApprovals]);

  const handleCreateSubmission = useCallback(async (data) => {
    await createSubmission(data);
    loadSubmissions({ page: 1, limit: 10 });
  }, [createSubmission, loadSubmissions]);

  const handleSubmitDraft = useCallback(async (id) => {
    try {
      await submitSubmission(id);
      loadSubmissions({ page: 1, limit: 10, status: statusFilter || undefined });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  }, [submitSubmission, loadSubmissions, statusFilter]);

  const handleViewDetail = useCallback((submission) => {
    setSelectedSubmission(submission);
    setShowDetailModal(true);
  }, []);

  const handleDelete = useCallback((id) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteSubmission(deleteTarget);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadSubmissions({ page: 1, limit: 10, status: statusFilter || undefined });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  }, [deleteTarget, deleteSubmission, loadSubmissions, statusFilter]);

  const handleApprove = useCallback(async (id) => {
    await approveSubmission(id);
    loadPendingApprovals({ page: 1, limit: 10 });
  }, [approveSubmission, loadPendingApprovals]);

  const handleRejectClick = useCallback((submission) => {
    setRejectTarget(submission);
    setShowDetailModal(false);
    setShowRejectModal(true);
  }, []);

  const handleRejectConfirm = useCallback(async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await rejectSubmission(rejectTarget._id || rejectTarget, reason);
      setShowRejectModal(false);
      setRejectTarget(null);
      loadPendingApprovals({ page: 1, limit: 10 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  }, [rejectTarget, rejectSubmission, loadPendingApprovals]);

  const toggleDraftSelect = useCallback((id) => {
    setSelectedDrafts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBulkSubmit = useCallback(async () => {
    if (selectedDrafts.size === 0) return;
    setActionLoading(true);
    try {
      await bulkSubmit(Array.from(selectedDrafts));
      setSelectedDrafts(new Set());
      loadSubmissions({ page: 1, limit: 10, status: statusFilter || undefined });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk submit failed');
    } finally {
      setActionLoading(false);
    }
  }, [selectedDrafts, bulkSubmit, loadSubmissions, statusFilter]);

  const handlePageChange = useCallback((page) => {
    if (activeTab === 'my') {
      loadSubmissions({ page, limit: 10, status: statusFilter || undefined });
    } else {
      loadPendingApprovals({ page, limit: 10 });
    }
  }, [activeTab, statusFilter, loadSubmissions, loadPendingApprovals]);

  const currentList = activeTab === 'my' ? submissions : pendingApprovals;
  const currentPagination = activeTab === 'my' ? pagination : pendingPagination;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Timesheets</h1>
          <p className="text-[13px] text-white/40 mt-1">Submit and track your time entry approvals</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDrafts.size > 0 && (
            <button
              onClick={handleBulkSubmit}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/15 transition-all cursor-pointer disabled:opacity-50"
            >
              {actionLoading && (
                <div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              )}
              Submit {selectedDrafts.size} Draft{selectedDrafts.size > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-[13px] font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-0.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Submission
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 w-fit">
        <button
          onClick={() => { setActiveTab('my'); setSelectedDrafts(new Set()); }}
          className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'my'
              ? 'bg-cyan-500/15 text-cyan-400'
              : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
          }`}
        >
          My Submissions
        </button>
        {isManagerOrAdmin && (
          <button
            onClick={() => { setActiveTab('pending'); setSelectedDrafts(new Set()); }}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
          >
            Pending Approvals
            {pendingPagination.total > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-400 rounded-md border border-amber-500/20">
                {pendingPagination.total}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Status filter (only for My Submissions tab) */}
      {activeTab === 'my' && (
        <div className="flex items-center gap-1.5 mb-5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 w-fit">
          {STATUS_FILTERS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all cursor-pointer ${
                statusFilter === opt.value
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/[0.08] h-48 animate-pulse" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-white/15">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="text-[15px] font-medium">
            {activeTab === 'my' ? 'No submissions yet' : 'No pending approvals'}
          </p>
          <p className="text-[13px] text-white/20 mt-1">
            {activeTab === 'my'
              ? 'Create a submission to get your time entries approved'
              : 'All caught up! No timesheets waiting for your review.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentList.map((submission) => (
            <SubmissionCard
              key={submission._id}
              submission={submission}
              onView={handleViewDetail}
              onSubmit={handleSubmitDraft}
              onDelete={handleDelete}
              selectable={activeTab === 'my'}
              selected={selectedDrafts.has(submission._id)}
              onSelect={toggleDraftSelect}
              showUser={activeTab === 'pending'}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {currentPagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {[...Array(currentPagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                currentPagination.page === i + 1
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-white/40 hover:bg-white/[0.06]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateSubmissionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmission}
      />

      <SubmissionDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedSubmission(null); }}
        submission={selectedSubmission}
        getSubmission={getSubmission}
        isManagerOrAdmin={isManagerOrAdmin}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      <RejectionModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectTarget(null); }}
        onReject={handleRejectConfirm}
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        title="Delete Draft"
        message="Are you sure you want to delete this draft submission? This action cannot be undone."
        confirmText="Delete"
        loading={actionLoading}
      />
    </div>
  );
};

export default TimesheetsPage;
