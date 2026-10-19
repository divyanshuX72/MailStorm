/**
 * Campaigns Page — Campaign Management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { campaignsApi, smtpApi, templatesApi, contactsApi } from '@/services/data.service';
import { useGroups } from '@/hooks/useGroups';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Campaign, SmtpAccount, Template } from '@/types';
import {
  Plus, Send, Trash2, Play, Pause, StopCircle, Copy,
  X, Loader2, Search, ChevronLeft, ChevronRight, Eye,
  RotateCcw, Clock, CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; badge: string }> = {
  DRAFT: { color: 'hsl(var(--muted-foreground))', icon: Clock, badge: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' },
  SCHEDULED: { color: 'hsl(var(--primary))', icon: Clock, badge: 'badge-info' },
  RUNNING: { color: 'hsl(var(--warning))', icon: Play, badge: 'badge-warning' },
  PAUSED: { color: 'hsl(var(--warning))', icon: Pause, badge: 'badge-warning' },
  COMPLETED: { color: 'hsl(var(--success))', icon: CheckCircle2, badge: 'badge-success' },
  CANCELLED: { color: 'hsl(var(--muted-foreground))', icon: StopCircle, badge: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' },
  FAILED: { color: 'hsl(var(--destructive))', icon: XCircle, badge: 'badge-error' },
};

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '', subject: '', smtpAccountId: '', templateId: '',
    contactGroup: '', batchSize: 50, delayMs: 1000,
  });

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', page, search, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '12' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await campaignsApi.getAll(params);
      return res.data.data;
    },
    refetchInterval: 3000,
  });

  const { data: smtpAccounts } = useQuery({
    queryKey: ['smtp-accounts-select'],
    queryFn: async () => { const res = await smtpApi.getAll(); return res.data.data as SmtpAccount[]; },
    enabled: showForm,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates-select'],
    queryFn: async () => { const res = await templatesApi.getAll(); return (res.data.data as any)?.data as Template[] || []; },
    enabled: showForm,
  });

  const { data: groups } = useGroups();

  const createMutation = useMutation({
    mutationFn: (data: any) => campaignsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      switch (action) {
        case 'start': return campaignsApi.start(id);
        case 'pause': return campaignsApi.pause(id);
        case 'resume': return campaignsApi.resume(id);
        case 'cancel': return campaignsApi.cancel(id);
        case 'retry': return campaignsApi.retryFailed(id);
        case 'duplicate': return campaignsApi.duplicate(id);
        case 'rerun': return campaignsApi.rerun(id);
        case 'delete': return campaignsApi.delete(id);
        default: throw new Error('Unknown action');
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (action === 'rerun') {
        toast.success('Campaign duplicated successfully.');
      } else {
        toast.success(`Campaign ${action === 'delete' ? 'deleted' : action + 'ed'}`);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Action failed'),
  });

  const handleAction = (id: string, action: string) => {
    if (action === 'delete' && !confirm('Delete this campaign?')) return;
    if (action === 'cancel' && !confirm('Cancel this campaign?')) return;
    if (action === 'rerun' && !confirm('This will create a new campaign using the same template, subject, SMTP account, attachments, and contact list. Continue?')) return;
    actionMutation.mutate({ id, action });
  };

  const campaigns = campaignsData?.data || [];
  const pagination = campaignsData?.pagination;

  const inputClass = "h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Campaigns</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Create and manage email campaigns</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] hover:opacity-90">
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-4 text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="Search campaigns..." />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm outline-none">
          <option value="">All Status</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Campaign Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-56 rounded-2xl" />)}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: Campaign, index: number) => {
            const statusInfo = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusInfo.icon;
            const progress = campaign.totalRecipients > 0
              ? Math.round((campaign.sent / campaign.totalRecipients) * 100)
              : 0;

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-hover flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[hsl(var(--foreground))] truncate">{campaign.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{campaign.subject}</p>
                  </div>
                  <span className={`ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${statusInfo.badge}`}>
                    <StatusIcon className="h-3 w-3" /> {campaign.status}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{campaign.sent} / {campaign.totalRecipients} sent</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: statusInfo.color }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[hsl(var(--secondary)/0.5)] p-2">
                    <p className="text-sm font-bold text-[hsl(var(--foreground))]">{campaign.sent}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Sent</p>
                  </div>
                  <div className="rounded-lg bg-[hsl(var(--secondary)/0.5)] p-2">
                    <p className="text-sm font-bold text-[hsl(var(--foreground))]">{campaign.failed}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Failed</p>
                  </div>
                  <div className="rounded-lg bg-[hsl(var(--secondary)/0.5)] p-2">
                    <p className="text-sm font-bold text-[hsl(var(--foreground))]">{campaign.totalRecipients}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Total</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-1.5 border-t border-[hsl(var(--border))] pt-3">
                  <button onClick={() => navigate(`/campaigns/${campaign.id}`)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" title="View Details"><Eye className="h-4 w-4" /></button>
                  
                  {campaign.status === 'DRAFT' && (
                    <button onClick={() => handleAction(campaign.id, 'start')} className="rounded-lg p-1.5 text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.1)]" title="Start"><Play className="h-4 w-4" /></button>
                  )}
                  {campaign.status === 'RUNNING' && (
                    <button onClick={() => handleAction(campaign.id, 'pause')} className="rounded-lg p-1.5 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.1)]" title="Pause"><Pause className="h-4 w-4" /></button>
                  )}
                  {campaign.status === 'PAUSED' && (
                    <button onClick={() => handleAction(campaign.id, 'resume')} className="rounded-lg p-1.5 text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.1)]" title="Resume"><Play className="h-4 w-4" /></button>
                  )}
                  {['RUNNING', 'PAUSED'].includes(campaign.status) && (
                    <button onClick={() => handleAction(campaign.id, 'cancel')} className="rounded-lg p-1.5 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]" title="Cancel"><StopCircle className="h-4 w-4" /></button>
                  )}
                  {['COMPLETED', 'FAILED'].includes(campaign.status) && campaign.failed > 0 && (
                    <button onClick={() => handleAction(campaign.id, 'retry')} className="rounded-lg p-1.5 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.1)]" title="Retry Failed"><RotateCcw className="h-4 w-4" /></button>
                  )}
                  {['COMPLETED', 'FAILED', 'CANCELLED'].includes(campaign.status) && (
                    <button onClick={() => handleAction(campaign.id, 'rerun')} className="rounded-lg p-1.5 text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.1)]" title="Run Again"><RefreshCw className="h-4 w-4" /></button>
                  )}

                  <button onClick={() => handleAction(campaign.id, 'duplicate')} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" title="Duplicate"><Copy className="h-4 w-4" /></button>
                  {['DRAFT', 'CANCELLED', 'COMPLETED', 'FAILED'].includes(campaign.status) && (
                    <button onClick={() => handleAction(campaign.id, 'delete')} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)]" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] py-16">
          <Send className="mb-3 h-12 w-12 text-[hsl(var(--muted-foreground)/0.3)]" />
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No campaigns found</p>
          <button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Create Campaign</button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="rounded-lg border border-[hsl(var(--border))] p-2 hover:bg-[hsl(var(--secondary))] disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="rounded-lg border border-[hsl(var(--border))] p-2 hover:bg-[hsl(var(--secondary))] disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Campaign" maxWidth="max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...form, batchSize: Number(form.batchSize), delayMs: Number(form.delayMs) }); }} className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium">Campaign Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="July Newsletter" required /></div>
          <div><label className="mb-1 block text-sm font-medium">Subject Line *</label><input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className={inputClass} placeholder="Hello {{name}}!" required /></div>

          <div><label className="mb-1 block text-sm font-medium">SMTP Account *</label>
            <select value={form.smtpAccountId} onChange={e => setForm(p => ({ ...p, smtpAccountId: e.target.value }))} className={inputClass} required>
              <option value="">Select SMTP account</option>
              {smtpAccounts?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.provider})</option>)}
            </select>
          </div>

          <div><label className="mb-1 block text-sm font-medium">Template *</label>
            <select value={form.templateId} onChange={e => setForm(p => ({ ...p, templateId: e.target.value }))} className={inputClass} required>
              <option value="">Select template</option>
              {templates?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div><label className="mb-1 block text-sm font-medium">Contact Group *</label>
            <select value={form.contactGroup} onChange={e => setForm(p => ({ ...p, contactGroup: e.target.value }))} className={inputClass} required>
              <option value="">Select group</option>
              {groups?.map(g => <option key={g.name} value={g.name}>{g.name} ({g.count})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium">Batch Size</label><input type="number" value={form.batchSize} onChange={e => setForm(p => ({ ...p, batchSize: Number(e.target.value) }))} className={inputClass} min={1} max={500} /></div>
            <div><label className="mb-1 block text-sm font-medium">Delay (ms)</label><input type="number" value={form.delayMs} onChange={e => setForm(p => ({ ...p, delayMs: Number(e.target.value) }))} className={inputClass} min={100} max={60000} /></div>
          </div>

          <div className="flex gap-3 pt-4 mt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--secondary))]">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex flex-1 items-center justify-center rounded-xl gradient-primary py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
