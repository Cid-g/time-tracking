import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await login(formData);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) {
        const fieldErrors = {};
        response.errors.forEach((error) => {
          const field = error.field.replace('body.', '');
          fieldErrors[field] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: response?.message || 'Login failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome back</h2>
        <p className="text-white/40 text-[15px]">Sign in to your account to continue</p>
      </div>

      {/* Error banner */}
      {errors.general && (
        <div className="flex items-center gap-2.5 bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-[13px] font-medium border border-red-500/20 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{errors.general}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-semibold text-white/50">Email address</label>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 text-white/30 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className={`w-full pl-11 pr-3.5 py-2.5 border rounded-xl text-sm font-normal bg-white/[0.05] text-white placeholder-white/25 outline-none transition-all duration-150 focus:border-cyan-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] ${errors.email ? 'border-red-500/40' : 'border-white/[0.08]'}`}
            />
          </div>
          {errors.email && <span className="text-red-400 text-xs font-medium">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-[13px] font-semibold text-white/50">Password</label>
            <Link to="/forgot-password" className="text-[13px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 text-white/30 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className={`w-full pl-11 pr-12 py-2.5 border rounded-xl text-sm font-normal bg-white/[0.05] text-white placeholder-white/25 outline-none transition-all duration-150 focus:border-cyan-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] ${errors.password ? 'border-red-500/40' : 'border-white/[0.08]'}`}
            />
            <button
              type="button"
              className="absolute right-3 flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <span className="text-red-400 text-xs font-medium">{errors.password}</span>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Signing in...
            </>
          ) : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-white/[0.08]"></div>
        <span className="text-xs text-white/25 uppercase tracking-widest font-medium">or</span>
        <div className="flex-1 h-px bg-white/[0.08]"></div>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-white/40">
        Don't have an account? <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Create one</Link>
      </p>
    </div>
  );
};

export default LoginPage;
