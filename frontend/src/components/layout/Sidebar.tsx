/**
 * Sidebar Component — Main Navigation
 * Collapsible sidebar with role-based menu items and active state
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  Send,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Server,
  Bot,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'SMTP Accounts', icon: Server, path: '/smtp' },
  { label: 'Contacts', icon: Users, path: '/contacts' },
  { label: 'Templates', icon: FileText, path: '/templates' },
  { label: 'Campaigns', icon: Send, path: '/campaigns' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'AI Command', icon: Bot, path: '/ai-command' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] sidebar-transition',
        isCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[hsl(var(--sidebar-border))] px-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap text-lg font-bold text-[hsl(var(--sidebar-foreground))]"
              >
                MailStorm
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          // Filter by role if specified
          if (item.roles && user && !item.roles.includes(user.role)) return null;

          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md shadow-[hsl(var(--primary)/0.3)]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-[hsl(var(--primary-foreground))]')} />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
