/**
 * Profile Page
 */

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building, Lock, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await authApi.updateProfile(profile);
      updateUser(res.data.data!);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPw(true);
    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setIsChangingPw(false);
    }
  };

  const inputClass = "h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Profile</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Manage your account settings</p>
      </div>

      {/* Avatar Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-3xl font-bold text-white shadow-lg shadow-[hsl(var(--primary)/0.3)]">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">{user?.name}</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{user?.email}</p>
          <span className="mt-1 inline-block rounded-md bg-[hsl(var(--primary)/0.1)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--primary))]">{user?.role}</span>
        </div>
      </motion.div>

      {/* Profile Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Personal Information</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> Full Name</label>
            <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> Email</label>
            <input value={user?.email || ''} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium"><Phone className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> Phone</label>
              <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium"><Building className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> Company</label>
              <input value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={isUpdating} className="flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </button>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /> Current Password</label>
            <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} className={inputClass} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">New Password</label>
              <input type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm Password</label>
              <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} className={inputClass} required />
            </div>
          </div>
          <button type="submit" disabled={isChangingPw} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-5 py-2.5 text-sm font-medium hover:bg-[hsl(var(--secondary))] disabled:opacity-50">
            {isChangingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Change Password
          </button>
        </form>
      </motion.div>
    </div>
  );
}
