/**
 * Reports Page — Analytics & Exports
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/data.service';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Download, Calendar, Activity,
  TrendingUp, Server,
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'smtp' | 'activity'>('daily');

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['report-daily'],
    queryFn: async () => { const res = await reportsApi.getDailyReport(30); return res.data.data; },
    enabled: activeTab === 'daily',
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['report-monthly'],
    queryFn: async () => { const res = await reportsApi.getMonthlyReport(12); return res.data.data; },
    enabled: activeTab === 'monthly',
  });

  const { data: smtpData, isLoading: smtpLoading } = useQuery({
    queryKey: ['report-smtp'],
    queryFn: async () => { const res = await reportsApi.getSmtpUsage(); return res.data.data; },
    enabled: activeTab === 'smtp',
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['report-activity'],
    queryFn: async () => { const res = await reportsApi.getActivityLogs({ limit: '50' }); return res.data.data; },
    enabled: activeTab === 'activity',
  });

  const handleExport = async (type: 'daily' | 'monthly') => {
    try {
      const response = await reportsApi.exportExcel(type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const tabs = [
    { key: 'daily' as const, label: 'Daily Report', icon: Calendar },
    { key: 'monthly' as const, label: 'Monthly Report', icon: TrendingUp },
    { key: 'smtp' as const, label: 'SMTP Usage', icon: Server },
    { key: 'activity' as const, label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Reports</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Analytics and performance reports</p>
        </div>
        {(activeTab === 'daily' || activeTab === 'monthly') && (
          <button onClick={() => handleExport(activeTab)} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-[hsl(var(--secondary)/0.5)] p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* Daily Report */}
        {activeTab === 'daily' && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Campaigns</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Sent</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Failed</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Rate</th>
                </tr></thead>
                <tbody>
                  {dailyLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <tr key={i} className="border-b border-[hsl(var(--border))]"><td colSpan={5} className="px-4 py-3"><div className="skeleton h-6 w-full" /></td></tr>)
                  ) : Array.isArray(dailyData) && dailyData.length > 0 ? (
                    dailyData.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/0.2)]">
                        <td className="px-4 py-3 font-medium">{row.date || row._id}</td>
                        <td className="px-4 py-3 text-right">{row.campaigns || 0}</td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--success))]">{row.sent || 0}</td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--destructive))]">{row.failed || 0}</td>
                        <td className="px-4 py-3 text-right">{row.sent > 0 ? Math.round((row.sent / (row.sent + (row.failed || 0))) * 100) : 0}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="py-12 text-center text-[hsl(var(--muted-foreground))]">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly Report */}
        {activeTab === 'monthly' && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Month</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Campaigns</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Sent</th>
                  <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Failed</th>
                </tr></thead>
                <tbody>
                  {monthlyLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <tr key={i} className="border-b border-[hsl(var(--border))]"><td colSpan={4} className="px-4 py-3"><div className="skeleton h-6 w-full" /></td></tr>)
                  ) : Array.isArray(monthlyData) && monthlyData.length > 0 ? (
                    monthlyData.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/0.2)]">
                        <td className="px-4 py-3 font-medium">{row.month || row._id}</td>
                        <td className="px-4 py-3 text-right">{row.campaigns || 0}</td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--success))]">{row.sent || 0}</td>
                        <td className="px-4 py-3 text-right text-[hsl(var(--destructive))]">{row.failed || 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="py-12 text-center text-[hsl(var(--muted-foreground))]">No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SMTP Usage */}
        {activeTab === 'smtp' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {smtpLoading ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)
            ) : Array.isArray(smtpData) && smtpData.length > 0 ? (
              smtpData.map((smtp: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)]"><Server className="h-5 w-5 text-[hsl(var(--primary))]" /></div>
                    <div><h3 className="font-semibold">{smtp.name}</h3><p className="text-xs text-[hsl(var(--muted-foreground))]">{smtp.provider}</p></div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-[hsl(var(--muted-foreground))]">Today</span><span className="font-medium">{smtp.sentToday || 0} / {smtp.maxPerDay}</span></div>
                    <div className="h-2 rounded-full bg-[hsl(var(--secondary))]"><div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${Math.min(100, ((smtp.sentToday || 0) / smtp.maxPerDay) * 100)}%` }} /></div>
                    <div className="flex justify-between text-sm"><span className="text-[hsl(var(--muted-foreground))]">This Hour</span><span className="font-medium">{smtp.sentThisHour || 0} / {smtp.maxPerHour}</span></div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))]">No SMTP accounts</div>
            )}
          </div>
        )}

        {/* Activity Log */}
        {activeTab === 'activity' && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Entity</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] md:table-cell">User</th>
                </tr></thead>
                <tbody>
                  {activityLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <tr key={i} className="border-b border-[hsl(var(--border))]"><td colSpan={4} className="px-4 py-3"><div className="skeleton h-6 w-full" /></td></tr>)
                  ) : (activityData as any)?.logs?.length > 0 ? (
                    (activityData as any).logs.map((log: any) => (
                      <tr key={log.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/0.2)]">
                        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          log.action === 'CREATE' ? 'badge-success' : log.action === 'DELETE' ? 'badge-error' : log.action === 'SEND' ? 'badge-info' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                        }`}>{log.action}</span></td>
                        <td className="px-4 py-3">{log.entity}</td>
                        <td className="hidden px-4 py-3 text-[hsl(var(--muted-foreground))] md:table-cell">{log.user?.name || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="py-12 text-center text-[hsl(var(--muted-foreground))]">No activity yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
