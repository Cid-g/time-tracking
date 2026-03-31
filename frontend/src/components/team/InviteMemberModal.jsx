import { useState, useEffect } from 'react';
import useTeam from '../../hooks/useTeam';
import toast from 'react-hot-toast';

const inputClass = (hasError) =>
  `w-full px-3.5 py-2.5 text-[14px] bg-white/[0.05] border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-150 ${
    hasError ? 'border-red-500/40' : 'border-white/[0.08]'
  }`;

const InviteMemberModal = ({ isOpen, onClose, onSuccess }) => {
  const { inviteMember } = useTeam();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'member',
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({ email: '', firstName: '', lastName: '', role: 'member' });
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await inviteMember({
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/[0.08] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">Invite Team Member</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="colleague@company.com"
              className={inputClass(errors.email)}
            />
            {errors.email && (
              <p className="mt-1 text-[12px] text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Juan"
                className={inputClass(errors.firstName)}
              />
              {errors.firstName && (
                <p className="mt-1 text-[12px] text-red-400">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Dela Cruz"
                className={inputClass(errors.lastName)}
              />
              {errors.lastName && (
                <p className="mt-1 text-[12px] text-red-400">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-1.5">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className={inputClass(false) + ' cursor-pointer'}
            >
              <option value="member" className="bg-slate-900 text-white">Member</option>
              <option value="manager" className="bg-slate-900 text-white">Manager</option>
              <option value="client" className="bg-slate-900 text-white">Client</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-medium text-white/60 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl border border-white/[0.08] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
