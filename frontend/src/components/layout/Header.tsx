/**
 * Header Component — Top Bar
 * Theme toggle, user dropdown, search
 */

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { authApi } from '@/services/auth.service';
import toast from 'react-hot-toast';
import {
  Moon,
  Sun,
  LogOut,
  User,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.8)] px-6 backdrop-blur-lg">
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search..."
          className="h-9 w-72 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[hsl(var(--secondary))]"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px] text-[hsl(var(--muted-foreground))]" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-[hsl(var(--muted-foreground))]" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-[hsl(var(--secondary))]">
          <Bell className="h-[18px] w-[18px] text-[hsl(var(--muted-foreground))]" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--destructive))] text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-[hsl(var(--secondary))]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user?.name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{user?.role}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-[hsl(var(--muted-foreground))] md:block" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 animate-scale-in rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 shadow-xl">
              <button
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))]"
              >
                <User className="h-4 w-4" /> Profile
              </button>
              <div className="my-1 border-t border-[hsl(var(--border))]" />
              <button
                onClick={() => { handleLogout(); setShowDropdown(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[hsl(var(--destructive))] transition-colors hover:bg-[hsl(var(--destructive)/0.1)]"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
