import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// Dashboard Pages
import DashboardPage from '@/pages/dashboard/DashboardPage';
import SmtpPage from '@/pages/smtp/SmtpPage';
import ContactsPage from '@/pages/contacts/ContactsPage';
import TemplatesPage from '@/pages/templates/TemplatesPage';
import CampaignsPage from '@/pages/campaigns/CampaignsPage';
import CampaignDetailPage from '@/pages/campaigns/CampaignDetailPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import AiCommandPage from '@/pages/ai/AiCommandPage';
import ProfilePage from '@/pages/settings/ProfilePage';
import SettingsPage from '@/pages/settings/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="animate-pulse-glow h-10 w-10 rounded-full bg-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Wrapper (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="animate-pulse-glow h-10 w-10 rounded-full bg-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/smtp" element={<SmtpPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/ai-command" element={<AiCommandPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
