/**
 * Auth Layout — Centered Card with Gradient Background
 */

import { Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-auth p-4">
      {/* Decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[hsl(var(--accent)/0.08)] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-[hsl(var(--primary)/0.3)]">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">MailStorm</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Email Campaign Management</p>
        </div>

        {/* Auth Card */}
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
