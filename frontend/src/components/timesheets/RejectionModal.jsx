import { useState, useEffect } from 'react';

const RejectionModal = ({ isOpen, onClose, onReject, loading = false }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onReject(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 shadow-2xl animate-fade-in-up">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-500/10 rounded-xl border border-red-500/15">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h3 className="text-[16px] font-semibold text-white text-center mb-1">Reject Timesheet</h3>
        <p className="text-[13px] text-white/40 text-center mb-5">
          Please provide a reason for the rejection. The member will be notified.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason..."
            maxLength={500}
            rows={4}
            required
            className="w-full px-4 py-3 text-[13px] bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 transition-all resize-none"
            autoFocus
          />
          <p className="text-[11px] text-white/20 mt-1 text-right">{reason.length}/500</p>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-[13px] font-medium text-white/60 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl border border-white/[0.08] transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-red-500/80 hover:bg-red-500 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionModal;
