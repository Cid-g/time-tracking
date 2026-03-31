import { useState, useRef, useEffect } from 'react';
import useProject from '../../hooks/useProject';

const ProjectSelector = ({ value, onChange, className = '' }) => {
  const { projects, loading } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = projects.find((p) => p._id === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-left text-[14px] text-white/70 hover:bg-white/[0.08] hover:border-white/[0.12] transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/40"
      >
        {selected ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selected.color || '#06b6d4' }}
            />
            <span className="text-white/90 truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-white/40">Select project...</span>
        )}
        <svg className="w-4 h-4 ml-auto text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-h-48 overflow-y-auto">
          {/* Clear selection */}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-white/40 hover:bg-white/[0.06] transition-colors"
          >
            No project
          </button>

          {loading ? (
            <div className="px-3.5 py-2 text-[13px] text-white/30">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="px-3.5 py-2 text-[13px] text-white/30">No projects available</div>
          ) : (
            projects.map((project) => (
              <button
                key={project._id}
                type="button"
                onClick={() => {
                  onChange(project._id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-white/[0.06] transition-colors ${
                  value === project._id ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/70'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: project.color || '#06b6d4' }}
                />
                <span className="truncate">{project.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
