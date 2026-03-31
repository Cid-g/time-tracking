import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center animate-fade-in-up">
        {/* Shield icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-2xl border border-red-500/15">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-[15px] text-white/40 mb-8 max-w-sm mx-auto">
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-[13px] font-medium text-white/60 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl border border-white/[0.08] transition-all duration-150 cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all duration-150 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
