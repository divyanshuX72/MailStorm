/**
 * Campaign Detail Page — Progress, Recipients, Actions
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/services/data.service';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  ArrowLeft, Play, Pause, StopCircle, RotateCcw,
  Send, Users, CheckCircle2, XCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientFilter, setRecipientFilter] = useState('');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => { const res = await campaignsApi.getById(id!); return res.data.data; },
    enabled: !!id,
  });

  const { data: progressData } = useQuery({
    queryKey: ['campaign-progress', id],
    queryFn: async () => { const res = await campaignsApi.getProgress(id!); return res.data.data; },
    enabled: !!id && campaign?.status === 'RUNNING',
    refetchInterval: campaign?.status === 'RUNNING' ? 3000 : false,
  });

  const { data: recipientsData } = useQuery({
    queryKey: ['campaign-recipients', id, recipientPage, recipientFilter],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(recipientPage), limit: '20' };
      if (recipientFilter) params.status = recipientFilter;
      const res = await campaignsApi.getRecipients(id!, params);
      return res.data.data;
    },
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: (action: string) => {
      switch (action) {
        case 'start': return campaignsApi.start(id!);
        case 'pause': return campaignsApi.pause(id!);
        case 'resume': return campaignsApi.resume(id!);
        case 'cancel': return campaignsApi.cancel(id!);
        case 'retry': return campaignsApi.retryFailed(id!);
        default: throw new Error('Unknown');
      }
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-progress', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-recipients', id] });
      toast.success(`Campaign ${action}ed`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="mb-3 h-12 w-12 text-[hsl(var(--warning))]" />
        <p className="text-lg font-medium">Campaign not found</p>
        <button onClick={() => navigate('/campaigns')} className="mt-4 text-sm text-[hsl(var(--primary))] hover:underline">Back to campaigns</button>
      </div>
    );
  }

  const progress = campaign.totalRecipients > 0
    ? Math.round(((progressData?.sent ?? campaign.sent) / campaign.totalRecipients) * 100)
    : 0;

  const recipients = recipientsData?.data || [];
  const recipientPagination = recipientsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/campaigns')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{campaign.name}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{campaign.subject}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && (
            <button onClick={() => actionMutation.mutate('start')} disabled={actionMutation.isPending} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--success))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4" /> Start Campaign</>}
            </button>
          )}
          {campaign.status === 'RUNNING' && (
            <button onClick={() => actionMutation.mutate('pause')} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--warning))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Pause className="h-4 w-4" /> Pause</button>
          )}
          {campaign.status === 'PAUSED' && (
            <button onClick={() => actionMutation.mutate('resume')} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--success))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"><Play className="h-4 w-4" /> Resume</button>
          )}
          {['RUNNING', 'PAUSED'].includes(campaign.status) && (
            <button onClick={() => { if (confirm('Cancel?')) actionMutation.mutate('cancel'); }} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--destructive))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"><StopCircle className="h-4 w-4" /> Cancel</button>
          )}
          {campaign.failed > 0 && ['COMPLETED', 'FAILED'].includes(campaign.status) && (
            <button onClick={() => actionMutation.mutate('retry')} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--secondary))]"><RotateCcw className="h-4 w-4" /> Retry Failed</button>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Campaign Progress</h2>
          <span className={`rounded-lg px-3 py-1 text-sm font-medium ${
            campaign.status === 'COMPLETED' ? 'badge-success' :
            campaign.status === 'RUNNING' ? 'badge-warning' :
            campaign.status === 'FAILED' ? 'badge-error' :
            'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
          }`}>{campaign.status}</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">{progressData?.sent ?? campaign.sent} of {campaign.totalRecipients} sent</span>
            <span className="font-medium text-[hsl(var(--foreground))]">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full gradient-primary"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: 'Total', value: campaign.totalRecipients, icon: Users, color: 'hsl(var(--primary))' },
            { label: 'Sent', value: progressData?.sent ?? campaign.sent, icon: CheckCircle2, color: 'hsl(var(--success))' },
            { label: 'Failed', value: progressData?.failed ?? campaign.failed, icon: XCircle, color: 'hsl(var(--destructive))' },
            { label: 'Opened', value: campaign.opened || 0, icon: Send, color: 'hsl(var(--accent))' },
            { label: 'Bounced', value: campaign.bounced || 0, icon: AlertTriangle, color: 'hsl(var(--warning))' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-[hsl(var(--secondary)/0.5)] p-4 text-center">
              <stat.icon className="mx-auto mb-1.5 h-5 w-5" style={{ color: stat.color }} />
              <p className="text-xl font-bold text-[hsl(var(--foreground))]">{stat.value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Campaign Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h2 className="mb-4 text-lg font-semibold">Details</h2>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Template', value: campaign.template?.name || '—' },
            { label: 'SMTP', value: campaign.smtpAccount ? `${campaign.smtpAccount.name} (${campaign.smtpAccount.provider})` : '—' },
            { label: 'Contact Group', value: campaign.contactGroup || '—' },
            { label: 'Batch Size', value: campaign.batchSize },
            { label: 'Delay', value: `${campaign.delayMs}ms` },
            { label: 'Created', value: new Date(campaign.createdAt).toLocaleString() },
            { label: 'Started', value: campaign.startedAt ? new Date(campaign.startedAt).toLocaleString() : '—' },
            { label: 'Completed', value: campaign.completedAt ? new Date(campaign.completedAt).toLocaleString() : '—' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[hsl(var(--muted-foreground))]">{item.label}</p>
              <p className="font-medium text-[hsl(var(--foreground))]">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recipients Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-4">
          <h2 className="text-lg font-semibold">Recipients</h2>
          <select value={recipientFilter} onChange={(e) => { setRecipientFilter(e.target.value); setRecipientPage(1); }} className="h-9 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm outline-none">
            <option value="">All</option>
            <option value="SENT">Sent</option><option value="FAILED">Failed</option><option value="PENDING">Pending</option><option value="SENDING">Sending</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Name</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Status</th>
              <th className="hidden px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] md:table-cell">Sent At</th>
              <th className="hidden px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] lg:table-cell">Error</th>
            </tr></thead>
            <tbody>
              {recipients.length > 0 ? recipients.map((r: any) => (
                <tr key={r.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/0.2)]">
                  <td className="px-4 py-3 font-medium">{r.contact?.email}</td>
                  <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{[r.contact?.firstName, r.contact?.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    r.status === 'SENT' ? 'badge-success' : r.status === 'FAILED' ? 'badge-error' : r.status === 'SENDING' ? 'badge-warning' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  }`}>{r.status}</span></td>
                  <td className="hidden px-4 py-3 text-[hsl(var(--muted-foreground))] md:table-cell">{r.sentAt ? new Date(r.sentAt).toLocaleString() : '—'}</td>
                  <td className="hidden px-4 py-3 text-xs text-[hsl(var(--destructive))] lg:table-cell max-w-[200px] truncate">{r.error || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No recipients found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {recipientPagination && recipientPagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Page {recipientPagination.page} of {recipientPagination.totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setRecipientPage(p => Math.max(1, p - 1))} disabled={!recipientPagination.hasPrev} className="rounded-lg border border-[hsl(var(--border))] p-1.5 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setRecipientPage(p => p + 1)} disabled={!recipientPagination.hasNext} className="rounded-lg border border-[hsl(var(--border))] p-1.5 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
