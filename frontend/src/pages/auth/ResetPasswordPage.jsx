import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPasswordApi } from '../../api/auth.api';
import toast from 'react-hot-toast';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      await resetPasswordApi({ token, ...formData });
      toast.success('Password reset successfully!');
      navigate('/login', { replace: true });
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) {
        const fieldErrors = {};
        response.errors.forEach((error) => { fieldErrors[error.field.replace('body.', '')] = error.message; });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: response?.message || 'Reset failed. The link may have expired.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-500/10 text-red-400 rounded-full mb-5 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Invalid link</h2>
          <p className="text-white/40 text-[15px]">This password reset link is invalid or has expired.</p>
        </div>
        <Link to="/forgot-password" className="w-full flex items-center justify-center py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
          Request New Link
        </Link>
      </div>
    );
  }

  const PasswordInput = ({ id, name, label, placeholder, show, onToggle, error }) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-white/50">{label}</label>
      <div className="relative flex items-center">
        <svg className="absolute left-3.5 text-white/30 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <input
          id={id} name={name} type={show ? 'text' : 'password'} value={formData[name]} onChange={handleChange}
          placeholder={placeholder} required autoComplete="new-password"
          className={`w-full pl-11 pr-12 py-2.5 border rounded-xl text-sm bg-white/[0.05] text-white placeholder-white/25 outline-none transition-all duration-150 focus:border-cyan-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] ${error ? 'border-red-500/40' : 'border-white/[0.08]'}`}
        />
        <button type="button" className="absolute right-3 flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer" onClick={onToggle} tabIndex={-1}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <span className="text-red-400 text-xs font-medium">{error}</span>}
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl mb-5 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Set new password</h2>
        <p className="text-white/40 text-[15px]">Your new password must be different from previously used passwords.</p>
      </div>

      {errors.general && (
        <div className="flex items-center gap-2.5 bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-[13px] font-medium border border-red-500/20 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
        <PasswordInput id="password" name="password" label="New password" placeholder="Min 8 chars, upper, lower, digit, special" show={showPassword} onToggle={() => setShowPassword(!showPassword)} error={errors.password} />
        <PasswordInput id="confirmPassword" name="confirmPassword" label="Confirm new password" placeholder="Re-enter your new password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} error={errors.confirmPassword} />

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Resetting...</>
          ) : 'Reset Password'}
        </button>
      </form>

      <p className="text-center mt-6">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/40 hover:text-cyan-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Sign In
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;
