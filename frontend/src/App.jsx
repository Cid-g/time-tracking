import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy-loaded pages (code splitting)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const TimeTrackingPage = lazy(() => import('./pages/time-tracking/TimeTrackingPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const TimesheetsPage = lazy(() => import('./pages/timesheets/TimesheetsPage'));
const TeamPage = lazy(() => import('./pages/team/TeamPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const ClientPortalPage = lazy(() => import('./pages/client/ClientPortalPage'));
const MemberActivityPage = lazy(() => import('./pages/activity/MemberActivityPage'));

// Placeholder page for upcoming features (portfolio demo)
const PlaceholderPage = ({ title, description, icon }) => (
  <div className="animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-5 border border-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
      {icon}
    </div>
    <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
    <p className="text-white/35 text-[15px] max-w-md mb-6">{description}</p>
    <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] rounded-xl border border-white/[0.08] text-[13px] text-white/40 font-medium">
      <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
      In Development
    </div>
  </div>
);

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(15, 20, 35, 0.92)',
            backdropFilter: 'blur(20px)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0a0e1a' },
            style: { borderColor: 'rgba(16,185,129,0.15)' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0e1a' },
            style: { borderColor: 'rgba(239,68,68,0.15)' },
          },
        }}
      />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected app routes */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/time-tracker" element={<TimeTrackingPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/timesheets" element={<TimesheetsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/client-portal" element={<ClientPortalPage />} />
            <Route path="/activity" element={<MemberActivityPage />} />
            <Route path="/settings" element={
              <PlaceholderPage
                title="Settings"
                description="Configure your workspace, manage integrations, customize notifications, and set up billing preferences."
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
              />
            } />
          </Route>

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
