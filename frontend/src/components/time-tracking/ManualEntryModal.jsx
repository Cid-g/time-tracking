import { useState } from 'react';
import toast from 'react-hot-toast';
import { createManualEntryApi } from '../../api/timeEntry.api';
import ProjectSelector from '../common/ProjectSelector';
import TaskSelector from '../common/TaskSelector';

const ManualEntryModal = ({ isOpen, onClose, onEntryCreated }) => {
  const [form, setForm] = useState({
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    isBillable: true,
    project: null,
    task: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    if (!form.endTime) newErrors.endTime = 'End time is required';

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    const startDt = new Date(`${form.date}T${form.startTime}:00`);
    if (startDt > new Date()) {
      newErrors.startTime = 'Start time cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const startTime = new Date(`${form.date}T${form.startTime}:00`).toISOString();
      const endTime = new Date(`${form.date}T${form.endTime}:00`).toISOString();

      const { data } = await createManualEntryApi({
        description: form.description.trim(),
        startTime,
        endTime,
        isBillable: form.isBillable,
        project: form.project || undefined,
        task: form.task || undefined,
      });

      toast.success('Time entry added');
      onEntryCreated?.(data.data.entry);
      onClose();
      setForm({
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        isBillable: true,
        project: null,
        task: null,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create entry';
      toast.error(msg);
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/[0.08] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white">Add Manual Entry</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-all duration-150 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Description */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-1.5">Description</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What did you work on?"
              className={`${inputClass(false)} placeholder-white/25`}
            />
          </div>

          {/* Project & Task */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">Project</label>
              <ProjectSelector
                value={form.project}
                onChange={(id) => setForm((prev) => ({ ...prev, project: id, task: null }))}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">Task</label>
              <TaskSelector
                projectId={form.project}
                value={form.task}
                onChange={(id) => setForm((prev) => ({ ...prev, task: id }))}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[13px] font-medium text-white/50 mb-1.5">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={inputClass(errors.date)}
            />
            {errors.date && <p className="mt-1 text-[12px] text-red-400">{errors.date}</p>}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className={inputClass(errors.startTime)}
              />
              {errors.startTime && <p className="mt-1 text-[12px] text-red-400">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-1.5">End Time</label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                className={inputClass(errors.endTime)}
              />
              {errors.endTime && <p className="mt-1 text-[12px] text-red-400">{errors.endTime}</p>}
            </div>
          </div>

          {/* Billable toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="isBillable"
              checked={form.isBillable}
              onChange={handleChange}
              className="w-4 h-4 rounded border-white/20 bg-white/[0.05] text-cyan-500 focus:ring-cyan-500/20"
            />
            <span className="text-[13px] font-medium text-white/60">Billable</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-medium text-white/60 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl border border-white/[0.08] transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            >
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
