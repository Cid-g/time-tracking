import { useState } from 'react';
import toast from 'react-hot-toast';
import { createProjectApi } from '../../api/project.api';

const COLOR_SWATCHES = [
  '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316',
];

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#06b6d4',
    billingType: 'hourly',
    hourlyRate: '',
    budgetHours: '',
    startDate: '',
    endDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Project name is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        billingType: form.billingType,
      };
      if (form.hourlyRate) payload.hourlyRate = Number(form.hourlyRate);
      if (form.budgetHours) payload.budgetHours = Number(form.budgetHours);
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();

      await createProjectApi(payload);
      toast.success('Project created');
      onProjectCreated?.();
      setForm({
        name: '', description: '', color: '#06b6d4', billingType: 'hourly',
        hourlyRate: '', budgetHours: '', startDate: '', endDate: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-3.5 py-2.5 text-[14px] bg-white/[0.05] border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-150 ${
      hasError ? 'border-red-500/40' : 'border-white/[0.08]'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/[0.08] animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">Create Project</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-1.5">Project Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Client Website Redesign"
              maxLength={100}
              className={`${inputClass(errors.name)} placeholder-white/25`}
            />
            {errors.name && <p className="mt-1 text-[12px] text-red-400">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief project description..."
              rows={3}
              maxLength={1000}
              className={`${inputClass(false)} placeholder-white/25 resize-none`}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-2">Color</label>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className={`w-7 h-7 rounded-lg transition-all cursor-pointer ${
                    form.color === color
                      ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Billing Type */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-1.5">Billing Type</label>
            <select
              name="billingType"
              value={form.billingType}
              onChange={handleChange}
              className={inputClass(false)}
            >
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed Price</option>
              <option value="non_billable">Non-Billable</option>
            </select>
          </div>

          {/* Hourly Rate + Budget */}
          <div className="grid grid-cols-2 gap-3">
            {form.billingType === 'hourly' && (
              <div>
                <label className="block text-[13px] font-medium text-white/50 mb-1.5">Hourly Rate ($)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={`${inputClass(false)} placeholder-white/25`}
                />
              </div>
            )}
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">Budget (hours)</label>
              <input
                type="number"
                name="budgetHours"
                value={form.budgetHours}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className={`${inputClass(false)} placeholder-white/25`}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className={inputClass(errors.endDate)}
              />
              {errors.endDate && <p className="mt-1 text-[12px] text-red-400">{errors.endDate}</p>}
            </div>
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
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
