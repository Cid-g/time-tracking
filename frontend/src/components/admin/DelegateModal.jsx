import { useState, useEffect } from 'react';
import { listMembersApi } from '../../api/team.api';
import toast from 'react-hot-toast';

const DelegateModal = ({ submission, onClose, onDelegate }) => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState('');
  const [comment, setComment] = useState('');
  const [delegating, setDelegating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const { data } = await listMembersApi({ role: 'manager', limit: 50 });
        setManagers(data.data.members || []);
      } catch (err) {
        toast.error('Failed to load managers');
      } finally {
        setLoading(false);
      }
    };
    loadManagers();
  }, []);

  const filteredManagers = managers.filter((m) => {
    if (!search) return true;
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedManager) {
      toast.error('Please select a manager');
      return;
    }
    setDelegating(true);
    try {
      await onDelegate(selectedManager, comment);
    } finally {
      setDelegating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0f1425]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[16px] font-bold text-white">Delegate Submission</h2>
            <p className="text-[12px] text-white/30 mt-0.5">
              From {submission.user?.firstName} {submission.user?.lastName}
            </p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-all cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Search */}
          <div>
            <label className="text-[12px] font-medium text-white/40 block mb-1.5">Assign to Manager</label>
            <input
              type="text"
              placeholder="Search managers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-cyan-500/30 transition-all mb-2"
            />
          </div>

          {/* Manager list */}
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/[0.04] rounded-lg h-10 animate-pulse" />
                ))}
              </div>
            ) : filteredManagers.length === 0 ? (
              <p className="text-[12px] text-white/25 text-center py-4">No managers found</p>
            ) : (
              filteredManagers.map((m) => {
                const initials = `${m.firstName?.[0] || ''}${m.lastName?.[0] || ''}`.toUpperCase();
                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => setSelectedManager(m._id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                      selectedManager === m._id
                        ? 'bg-cyan-500/10 border border-cyan-500/20'
                        : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/70 to-purple-500/70 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-white/70 truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-[10px] text-white/25 truncate">{m.email}</p>
                    </div>
                    {selectedManager === m._id && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="ml-auto text-cyan-400 shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="text-[12px] font-medium text-white/40 block mb-1.5">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note for the assigned manager..."
              rows={2}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder:text-white/25 outline-none focus:border-cyan-500/30 transition-all resize-none"
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
              disabled={delegating || !selectedManager}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {delegating ? 'Delegating...' : 'Delegate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DelegateModal;
