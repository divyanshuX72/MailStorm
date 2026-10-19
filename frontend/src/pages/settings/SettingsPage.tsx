/**
 * Settings Page
 */

import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Moon, Sun, Shield, Info, Zap } from 'lucide-react';

export default function SettingsPage() {
  const { toggleTheme, isDark } = useTheme();
  const { user } = useAuthStore();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Settings</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Application preferences</p>
      </div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />} Appearance
        </h3>
        <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--secondary)/0.5)] p-4">
          <div>
            <p className="font-medium text-[hsl(var(--foreground))]">Dark Mode</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Toggle between light and dark theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative h-7 w-12 rounded-full transition-colors ${isDark ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))]'}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Shield className="h-5 w-5" /> Account</h3>
        <div className="space-y-3">
          {[
            { label: 'Account Type', value: user?.role === 'ADMIN' ? 'Administrator' : 'Standard User' },
            { label: 'Account Status', value: user?.isActive ? 'Active' : 'Inactive' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
            { label: 'Last Login', value: user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between rounded-lg p-3 hover:bg-[hsl(var(--secondary)/0.3)]">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</span>
              <span className="text-sm font-medium text-[hsl(var(--foreground))]">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Info className="h-5 w-5" /> About</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[hsl(var(--foreground))]">MailStorm</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Email Campaign Management System v1.0.0</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
