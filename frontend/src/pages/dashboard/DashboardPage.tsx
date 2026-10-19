/**
 * Dashboard Page — Main Analytics View
 */

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/data.service';
import { motion } from 'framer-motion';
import {
  Users, Send, CheckCircle2, XCircle, Server, FileText,
  TrendingUp, Mail,
} from 'lucide-react';

const statsConfig = [
  { key: 'totalContacts', label: 'Total Contacts', icon: Users, color: 'hsl(var(--primary))' },
  { key: 'totalCampaigns', label: 'Campaigns', icon: Send, color: 'hsl(var(--accent))' },
  { key: 'emailsSent', label: 'Emails Sent', icon: CheckCircle2, color: 'hsl(var(--success))' },
  { key: 'successRate', label: 'Success Rate', icon: TrendingUp, color: 'hsl(var(--warning))', suffix: '%' },
] as const;

export default function DashboardPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await reportsApi.getDashboard();
      return res.data.data;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ['campaign-history'],
    queryFn: async () => {
      const res = await reportsApi.getCampaignHistory(5);
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Dashboard</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Overview of your email campaign performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          const value = statsData ? (statsData as any)[stat.key] : 0;

          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-hover rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[hsl(var(--foreground))]">
                    {isLoading ? (
                      <span className="skeleton inline-block h-8 w-20" />
                    ) : (
                      <>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                        {'suffix' in stat && stat.suffix}
                      </>
                    )}
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Pending', value: statsData?.emailsPending || 0, icon: Mail, color: 'hsl(var(--warning))' },
          { label: 'Failed', value: statsData?.emailsFailed || 0, icon: XCircle, color: 'hsl(var(--destructive))' },
          { label: 'SMTP Accounts', value: statsData?.smtpAccounts || 0, icon: Server, color: 'hsl(var(--primary))' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="flex items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="h-5 w-5" style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? <span className="skeleton inline-block h-7 w-12" /> : item.value.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Recent Campaigns</h2>
        {historyData && Array.isArray(historyData) && historyData.length > 0 ? (
          <div className="space-y-3">
            {historyData.map((campaign: any) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] p-4 transition-colors hover:bg-[hsl(var(--secondary)/0.5)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)]">
                    <Send className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <p className="font-medium text-[hsl(var(--foreground))]">{campaign.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {campaign.sent}/{campaign.totalRecipients}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">sent</p>
                  </div>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    campaign.status === 'COMPLETED' ? 'badge-success' :
                    campaign.status === 'RUNNING' ? 'badge-info' :
                    campaign.status === 'FAILED' ? 'badge-error' :
                    campaign.status === 'PAUSED' ? 'badge-warning' :
                    'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Send className="mb-3 h-12 w-12 text-[hsl(var(--muted-foreground)/0.3)]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No campaigns yet</p>
            <p className="text-xs text-[hsl(var(--muted-foreground)/0.7)]">Create your first campaign to get started</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
