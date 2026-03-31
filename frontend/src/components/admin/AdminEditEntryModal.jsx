import { useState } from 'react';

const AdminEditEntryModal = ({ entry, onClose, onSave }) => {
  const [description, setDescription] = useState(entry.description || '');
  const [startTime, setStartTime] = useState(
    entry.startTime ? new Date(entry.startTime).toISOString().slice(0, 16) : ''
  );
  const [endTime, setEndTime] = useState(
    entry.endTime ? new Date(entry.endTime).toISOString().slice(0, 16) : ''
  );
  const [isBillable, setIsBillable] = useState(entry.isBillable ?? true);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSaving(true);
    const updates = {};
    if (description !== (entry.description || '')) updates.description = description;
    if (startTime && startTime !== new Date(entry.startTime).toISOString().slice(0, 16)) {
      updates.startTime = new Date(startTime).toISOString();
    }
    if (endTime && endTime !== (entry.endTime ? new Date(entry.endTime).toISOString().slice(0, 16) : '')) {
      updates.endTime = new Date(endTime).toISOString();
    }
    if (isBillable !== entry.isBillable) updates.isBillable = isBillable;

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return onClose();
    }

    try {
      await onSave(updates, reason);
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f1425]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[16px] font-bold text-white">Edit Time Entry</h2>
            <p className="text-[12px] text-white/30 mt-0.5">
              {entry.user?.firstName} {entry.user?.lastName} — {formatDuration(entry.duration)}
            </p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-all cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-white/40 block mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-cyan-500/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-white/40 block mb-1.5">Start Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white/70 outline-none focus:border-cyan-500/30 transition-all"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-white/40 block mb-1.5">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white/70 outline-none focus:border-cyan-500/30 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="accent-cyan-500 cursor-pointer"
              id="billable"
            />
            <label htmlFor="billable" className="text-[13px] text-white/50 cursor-pointer">Billable</label>
          </div>

          <div>
            <label className="text-[12px] font-medium text-red-400/70 block mb-1.5">
              Audit Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you making this change?"
              required
              rows={2}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-red-500/30 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-white/40 hover:text-white/60 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !reason.trim()}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditEntryModal;
