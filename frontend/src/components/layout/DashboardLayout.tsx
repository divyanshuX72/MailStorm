/**
 * Dashboard Layout — Main App Shell
 * Sidebar + Header + Main Content Area
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-1 flex-col sidebar-transition',
          isCollapsed ? 'ml-[70px]' : 'ml-[260px]'
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="page-container animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
