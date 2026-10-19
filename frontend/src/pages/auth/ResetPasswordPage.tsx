/**
 * Reset Password Page
 */

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isReset, setIsReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setIsReset(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isReset) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--success)/0.1)]">
          <CheckCircle2 className="h-7 w-7 text-[hsl(var(--success))]" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-[hsl(var(--foreground))]">Password reset!</h2>
        <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">Redirecting to login...</p>
        <Link to="/login" className="text-sm text-[hsl(var(--primary))] hover:underline">Go to login</Link>
      </div>
    );
  }

  const inputClass = "h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-11 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]";

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[hsl(var(--foreground))]">Reset password</h2>
      <p className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">Enter your new password</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass.replace('pr-11', 'pr-4')} placeholder="••••••••" />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="flex h-11 w-full items-center justify-center rounded-xl gradient-primary text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] transition-all hover:opacity-90 disabled:opacity-50">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
