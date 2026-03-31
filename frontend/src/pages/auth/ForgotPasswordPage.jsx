import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPasswordApi(email);
      setSubmitted(true);
      toast.success('Check your email for reset instructions.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full mb-5 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Check your email</h2>
          <p className="text-white/40 text-[15px]">
            If an account exists with <strong className="text-white/70">{email}</strong>, we've sent password reset instructions.
          </p>
        </div>
        <Link to="/login" className="w-full flex items-center justify-center py-2.5 px-5 bg-white/[0.06] hover:bg-white/[0.1] text-white/70 font-semibold text-sm rounded-xl border border-white/[0.08] transition-all">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl mb-5 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Forgot password?</h2>
        <p className="text-white/40 text-[15px]">No worries, we'll send you reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-semibold text-white/50">Email address</label>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 text-white/30 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="w-full pl-11 pr-3.5 py-2.5 border border-white/[0.08] rounded-xl text-sm bg-white/[0.05] text-white placeholder-white/25 outline-none transition-all duration-150 focus:border-cyan-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Sending...</>
          ) : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center mt-6">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/40 hover:text-cyan-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
