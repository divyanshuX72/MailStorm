/**
 * Login Page
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!form.email) { setErrors(prev => ({ ...prev, email: 'Email is required' })); return; }
    if (!form.password) { setErrors(prev => ({ ...prev, password: 'Password is required' })); return; }

    setIsLoading(true);
    try {
      const response = await authApi.login(form);
      const { user, accessToken, refreshToken } = response.data.data!;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[hsl(var(--foreground))]">Welcome back</h2>
      <p className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
            <Link to="/forgot-password" className="text-xs text-[hsl(var(--primary))] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-11 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center rounded-xl gradient-primary text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-[hsl(var(--primary))] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
