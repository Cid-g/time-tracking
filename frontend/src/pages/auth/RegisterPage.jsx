import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '', color: 'bg-white/10' },
    { label: 'Very weak', color: 'bg-red-500', textColor: 'text-red-400' },
    { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-400' },
    { label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-400' },
    { label: 'Strong', color: 'bg-cyan-400', textColor: 'text-cyan-400' },
    { label: 'Very strong', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
  ];
  return { score, ...levels[score] };
};

const InputField = ({ id, name, type = 'text', value, onChange, placeholder, icon, error, autoComplete, showToggle, showPassword, onToggle }) => (
  <div className="flex flex-col gap-1.5">
    <div className="relative flex items-center">
      <span className="absolute left-3.5 text-white/30 pointer-events-none">{icon}</span>
      <input
        id={id}
        name={name}
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        autoComplete={autoComplete}
        className={`w-full pl-11 ${showToggle ? 'pr-12' : 'pr-3.5'} py-2.5 border rounded-xl text-sm font-normal bg-white/[0.05] text-white placeholder-white/25 outline-none transition-all duration-150 focus:border-cyan-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] ${error ? 'border-red-500/40' : 'border-white/[0.08]'}`}
      />
      {showToggle && (
        <button
          type="button"
          className="absolute right-3 flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all cursor-pointer"
          onClick={onToggle}
          tabIndex={-1}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
    {error && <span className="text-red-400 text-xs font-medium">{error}</span>}
  </div>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      await register(formData);
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) {
        const fieldErrors = {};
        response.errors.forEach((error) => {
          fieldErrors[error.field.replace('body.', '')] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: response?.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Create your account</h2>
        <p className="text-white/40 text-[15px]">Start tracking your team's productivity</p>
      </div>

      {errors.general && (
        <div className="flex items-center gap-2.5 bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-[13px] font-medium border border-red-500/20 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-[13px] font-semibold text-white/50">First name</label>
            <InputField id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" icon={<UserIcon />} error={errors.firstName} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-[13px] font-semibold text-white/50">Last name</label>
            <InputField id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" icon={<UserIcon />} error={errors.lastName} />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-semibold text-white/50">Email address</label>
          <InputField id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" icon={<MailIcon />} error={errors.email} autoComplete="email" />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-semibold text-white/50">Password</label>
          <InputField id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a strong password" icon={<LockIcon />} error={errors.password} autoComplete="new-password" showToggle showPassword={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          {formData.password && (
            <div className="flex items-center gap-2.5 mt-0.5">
              <div className="flex gap-[3px] flex-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${level <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'}`} />
                ))}
              </div>
              <span className={`text-[11px] font-semibold whitespace-nowrap transition-colors duration-300 ${passwordStrength.textColor || 'text-white/30'}`}>
                {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-[13px] font-semibold text-white/50">Confirm password</label>
          <InputField id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" icon={<CheckIcon />} error={errors.confirmPassword} autoComplete="new-password" showToggle showPassword={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:-translate-y-px active:translate-y-0 transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Creating account...</>
          ) : 'Create Account'}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-white/[0.08]"></div>
        <span className="text-xs text-white/25 uppercase tracking-widest font-medium">or</span>
        <div className="flex-1 h-px bg-white/[0.08]"></div>
      </div>

      <p className="text-center text-sm text-white/40">
        Already have an account? <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
