/**
 * Forgot Password Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Email is required'); return; }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSent(true);
      toast.success('Reset link sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--success)/0.1)]">
          <CheckCircle2 className="h-7 w-7 text-[hsl(var(--success))]" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-[hsl(var(--foreground))]">Check your email</h2>
        <p className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[hsl(var(--primary))] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[hsl(var(--foreground))]">Forgot password?</h2>
      <p className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">Enter your email to receive a reset link</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]" placeholder="you@example.com" />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="flex h-11 w-full items-center justify-center rounded-xl gradient-primary text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] transition-all hover:opacity-90 disabled:opacity-50">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <Link to="/login" className="inline-flex items-center gap-1 text-[hsl(var(--primary))] hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </p>
    </div>
  );
}
