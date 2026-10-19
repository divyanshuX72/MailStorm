/**
 * SMTP Management Page
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smtpApi } from '@/services/data.service';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { SmtpAccount } from '@/types';
import {
  Plus, Server, Trash2, Edit, TestTube, Star, StarOff,
  Power, PowerOff, Loader2, X, Mail,
} from 'lucide-react';

const PROVIDER_PRESETS: Record<string, { host: string; port: number; encryption: string }> = {
  GMAIL: { host: 'smtp.gmail.com', port: 587, encryption: 'TLS' },
  OUTLOOK: { host: 'smtp.office365.com', port: 587, encryption: 'TLS' },
  ZOHO: { host: 'smtp.zoho.com', port: 465, encryption: 'SSL' },
  OFFICE365: { host: 'smtp.office365.com', port: 587, encryption: 'TLS' },
  CUSTOM: { host: '', port: 587, encryption: 'TLS' },
};

const PROVIDER_COLORS: Record<string, string> = {
  GMAIL: '#EA4335',
  OUTLOOK: '#0078D4',
  ZOHO: '#C8202B',
  OFFICE365: '#D83B01',
  CUSTOM: 'hsl(var(--muted-foreground))',
};

export default function SmtpPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const [form, setForm] = useState({
    name: '', host: '', port: 587, username: '', password: '',
    encryption: 'TLS', fromEmail: '', fromName: '', provider: 'CUSTOM',
    maxPerHour: 100, maxPerDay: 2000,
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['smtp-accounts'],
    queryFn: async () => { const res = await smtpApi.getAll(); return res.data.data as SmtpAccount[]; },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editingId ? smtpApi.update(editingId, data) : smtpApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-accounts'] });
      toast.success(editingId ? 'SMTP updated' : 'SMTP created');
      resetForm();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => smtpApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['smtp-accounts'] }); toast.success('Deleted'); },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete SMTP account'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => smtpApi.toggleEnabled(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smtp-accounts'] }),
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update status'),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => smtpApi.setDefault(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['smtp-accounts'] }); toast.success('Default status updated'); },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update default status'),
  });

  const testMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => smtpApi.test(id, email),
    onSuccess: (res) => {
      const result = res.data.data as any;
      if (result?.success) toast.success('Test email sent!');
      else toast.error(result?.message || 'Test failed');
      setTestingId(null);
    },
    onError: () => { toast.error('Test failed'); setTestingId(null); },
  });

  const resetForm = () => {
    setForm({ name: '', host: '', port: 587, username: '', password: '', encryption: 'TLS', fromEmail: '', fromName: '', provider: 'CUSTOM', maxPerHour: 100, maxPerDay: 2000 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDER_PRESETS[provider];
    setForm(prev => ({ ...prev, provider, host: preset.host, port: preset.port, encryption: preset.encryption }));
  };

  const handleEdit = (smtp: SmtpAccount) => {
    setForm({ name: smtp.name, host: smtp.host, port: smtp.port, username: smtp.username, password: '', encryption: smtp.encryption, fromEmail: smtp.fromEmail, fromName: smtp.fromName, provider: smtp.provider, maxPerHour: smtp.maxPerHour, maxPerDay: smtp.maxPerDay });
    setEditingId(smtp.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, port: Number(form.port), maxPerHour: Number(form.maxPerHour), maxPerDay: Number(form.maxPerDay) });
  };

  const inputClass = "h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]";
  const labelClass = "mb-1 block text-sm font-medium text-[hsl(var(--foreground))]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">SMTP Accounts</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Manage your email sending servers</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] transition-all hover:opacity-90">
          <Plus className="h-4 w-4" /> Add SMTP
        </button>
      </div>

      {/* SMTP Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((smtp, index) => (
            <motion.div key={smtp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="card-hover rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${PROVIDER_COLORS[smtp.provider]}15` }}>
                    <Server className="h-5 w-5" style={{ color: PROVIDER_COLORS[smtp.provider] }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{smtp.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{smtp.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {smtp.isDefault && <span className="badge-info rounded-md px-2 py-0.5 text-xs">Default</span>}
                  <span className={`rounded-md px-2 py-0.5 text-xs ${smtp.isEnabled ? 'badge-success' : 'badge-error'}`}>
                    {smtp.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="mb-4 space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                <p><span className="font-medium">Host:</span> {smtp.host}:{smtp.port}</p>
                <p><span className="font-medium">From:</span> {smtp.fromEmail}</p>
                <p><span className="font-medium">Today:</span> {smtp.sentToday}/{smtp.maxPerDay} emails</p>
              </div>

              <div className="flex items-center gap-1.5 border-t border-[hsl(var(--border))] pt-3">
                <button onClick={() => handleEdit(smtp)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]" title="Edit"><Edit className="h-4 w-4" /></button>
                <button onClick={() => { setTestingId(smtp.id); setTestEmail(''); }} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]" title="Test"><TestTube className="h-4 w-4" /></button>
                <button onClick={() => defaultMutation.mutate(smtp.id)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--warning))]" title="Set Default">{smtp.isDefault ? <Star className="h-4 w-4 fill-current text-[hsl(var(--warning))]" /> : <StarOff className="h-4 w-4" />}</button>
                <button onClick={() => toggleMutation.mutate(smtp.id)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))]" title="Toggle">{smtp.isEnabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</button>
                <button onClick={() => { if (confirm('Delete this SMTP account?')) deleteMutation.mutate(smtp.id); }} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))]" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] py-16">
          <Server className="mb-3 h-12 w-12 text-[hsl(var(--muted-foreground)/0.3)]" />
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No SMTP accounts</p>
          <p className="mb-4 text-xs text-[hsl(var(--muted-foreground)/0.7)]">Add your first SMTP server to start sending</p>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Add SMTP</button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={`${editingId ? 'Edit' : 'Add'} SMTP Account`} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Provider</label>
            <select value={form.provider} onChange={(e) => handleProviderChange(e.target.value)} className={inputClass}>
              <option value="GMAIL">Gmail</option><option value="OUTLOOK">Outlook</option><option value="ZOHO">Zoho</option><option value="OFFICE365">Office 365</option><option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Account Name</label><input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="My Gmail" required /></div>
            <div><label className={labelClass}>From Name</label><input value={form.fromName} onChange={(e) => setForm(p => ({ ...p, fromName: e.target.value }))} className={inputClass} placeholder="John Doe" required /></div>
          </div>
          <div><label className={labelClass}>From Email</label><input type="email" value={form.fromEmail} onChange={(e) => setForm(p => ({ ...p, fromEmail: e.target.value }))} className={inputClass} placeholder="john@gmail.com" required /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className={labelClass}>Host</label><input value={form.host} onChange={(e) => setForm(p => ({ ...p, host: e.target.value }))} className={inputClass} placeholder="smtp.gmail.com" required /></div>
            <div><label className={labelClass}>Port</label><input type="number" value={form.port} onChange={(e) => setForm(p => ({ ...p, port: Number(e.target.value) }))} className={inputClass} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>Username</label><input value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} className={inputClass} required /></div>
            <div><label className={labelClass}>Password</label><input type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} className={inputClass} placeholder={editingId ? '(unchanged)' : ''} required={!editingId} /></div>
          </div>
          <div><label className={labelClass}>Encryption</label>
            <select value={form.encryption} onChange={(e) => setForm(p => ({ ...p, encryption: e.target.value }))} className={inputClass}>
              <option value="TLS">TLS</option><option value="SSL">SSL</option><option value="NONE">None</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex flex-1 items-center justify-center rounded-xl gradient-primary py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Test SMTP Modal */}
      <Modal isOpen={!!testingId} onClose={() => setTestingId(null)} title="Test SMTP Connection" maxWidth="max-w-sm">
        <div className="mb-4">
          <label className={labelClass}>Send test email to</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-3 text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="test@example.com" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setTestingId(null)} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--secondary))]">Cancel</button>
          <button onClick={() => testMutation.mutate({ id: testingId!, email: testEmail })} disabled={!testEmail || testMutation.isPending} className="flex flex-1 items-center justify-center rounded-xl gradient-primary py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Test'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
