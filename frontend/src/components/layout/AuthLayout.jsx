import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — dark gradient with neon accents */}
      <div className="hidden lg:flex relative w-1/2 bg-gradient-to-br from-[#0a0e1a] via-[#0f1a2e] to-[#0a1628] p-12 items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-[480px] text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 text-xl font-bold mb-12">
            <div className="flex items-center justify-center w-11 h-11 bg-cyan-500/15 rounded-xl backdrop-blur-sm border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">WorkPulse</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            Manage your team's time with precision
          </h1>
          <p className="text-lg text-white/60 leading-relaxed mb-10">
            Track hours, boost productivity, and streamline approvals — all in one powerful platform built for modern teams.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-4">
            {['Real-time activity tracking', 'Automated timesheets & approvals', 'Productivity insights & analytics'].map((feature) => (
              <div key={feature} className="flex items-center gap-3.5 text-[15px] text-white/80">
                <div className="flex items-center justify-center w-8 h-8 bg-cyan-500/10 rounded-lg shrink-0 border border-cyan-500/15">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative neon circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[400px] h-[400px] -top-[100px] -right-[100px] rounded-full bg-cyan-500/[0.04] blur-sm"></div>
          <div className="absolute w-[300px] h-[300px] -bottom-[80px] -left-[60px] rounded-full bg-purple-500/[0.06] blur-sm"></div>
          <div className="absolute w-[200px] h-[200px] bottom-[40%] right-[10%] rounded-full bg-emerald-500/[0.03]"></div>
          {/* Neon glow orbs */}
          <div className="absolute w-[120px] h-[120px] top-[20%] right-[20%] rounded-full bg-cyan-500/[0.08] blur-[60px]"></div>
          <div className="absolute w-[100px] h-[100px] bottom-[25%] left-[15%] rounded-full bg-purple-500/[0.08] blur-[50px]"></div>
        </div>
      </div>

      {/* Right form panel — glass card on dark bg */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0e1a]/80 backdrop-blur-sm lg:w-1/2">
        <div className="w-full max-w-[420px] bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
