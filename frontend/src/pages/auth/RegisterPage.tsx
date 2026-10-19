/**
 * Register Page
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password))
      errs.password = 'Must include uppercase, lowercase, number, and special character';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const { user, accessToken, refreshToken } = response.data.data!;
      setAuth(user, accessToken, refreshToken);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]";

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-[hsl(var(--foreground))]">Create an account</h2>
      <p className="mb-6 text-sm text-[hsl(var(--muted-foreground))]">Start managing your email campaigns</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="John Doe" />
          </div>
          {errors.name && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="you@example.com" />
          </div>
          {errors.email && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} className={`${inputClass} pr-11`} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.password}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))} className={inputClass} placeholder="••••••••" />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={isLoading} className="flex h-11 w-full items-center justify-center rounded-xl gradient-primary text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] transition-all hover:opacity-90 disabled:opacity-50">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Already have an account? <Link to="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
