/**
 * Contacts Page — Contact Management
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/services/data.service';
import { useDebounce } from '@/hooks/useDebounce';
import { useGroups } from '@/hooks/useGroups';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Contact } from '@/types';
import { Plus, Search, Upload, Trash2, Edit, Users, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debouncedSearch = useDebounce(search, 300);

  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', company: '', phone: '', groupName: '' });

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', page, debouncedSearch, groupFilter],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (debouncedSearch) params.search = debouncedSearch;
      if (groupFilter) params.groupName = groupFilter;
      const res = await contactsApi.getAll(params);
      return res.data.data;
    },
  });

  const { data: groups } = useGroups();

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        company: data.company || undefined,
        phone: data.phone || undefined,
        groupName: data.groupName || undefined,
      };
      return editingContact ? contactsApi.update(editingContact.id, payload) : contactsApi.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); queryClient.invalidateQueries({ queryKey: ['contact-groups'] }); toast.success(editingContact ? 'Updated' : 'Created'); resetForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); queryClient.invalidateQueries({ queryKey: ['contact-groups'] }); toast.success('Deleted'); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => contactsApi.bulkDelete(ids),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); queryClient.invalidateQueries({ queryKey: ['contact-groups'] }); setSelectedIds([]); toast.success('Deleted'); },
  });

  const importMutation = useMutation({
    mutationFn: (formData: FormData) => contactsApi.import(formData),
    onSuccess: (res) => {
      const result = res.data.data;
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      toast.success(`Imported ${result?.imported || 0} contacts`);
      setShowImport(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Import failed'),
  });

  const resetForm = () => { setForm({ email: '', firstName: '', lastName: '', company: '', phone: '', groupName: '' }); setShowForm(false); setEditingContact(null); };

  const handleEdit = (contact: Contact) => {
    setForm({ email: contact.email, firstName: contact.firstName || '', lastName: contact.lastName || '', company: contact.company || '', phone: contact.phone || '', groupName: contact.groupName || '' });
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleImport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    importMutation.mutate(formData);
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => {
    if (!contactsData?.data) return;
    const allIds = contactsData.data.map(c => c.id);
    setSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
  };

  const contacts = contactsData?.data || [];
  const pagination = contactsData?.pagination;
  const inputClass = "h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm text-[hsl(var(--foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Contacts</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{pagination?.total || 0} total contacts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"><Upload className="h-4 w-4" /> Import</button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] hover:opacity-90"><Plus className="h-4 w-4" /> Add Contact</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] pl-10 pr-4 text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="Search contacts..." />
        </div>
        <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm outline-none">
          <option value="">All Groups ({groups?.reduce((acc, g) => acc + g.count, 0) || 0})</option>
          {groups?.map(g => <option key={g.name} value={g.name}>{g.name} ({g.count})</option>)}
        </select>
        {selectedIds.length > 0 && (
          <button onClick={() => { if (confirm(`Delete ${selectedIds.length} contacts?`)) bulkDeleteMutation.mutate(selectedIds); }} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--destructive))] px-4 py-2.5 text-sm font-medium text-white"><Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)]">
                <th className="w-12 px-4 py-3"><input type="checkbox" onChange={toggleSelectAll} checked={contacts.length > 0 && selectedIds.length === contacts.length} className="rounded" /></th>
                <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Email</th>
                <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Name</th>
                <th className="hidden px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] md:table-cell">Company</th>
                <th className="hidden px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] lg:table-cell">Group</th>
                <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Status</th>
                <th className="w-24 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border))]"><td colSpan={7} className="px-4 py-3"><div className="skeleton h-8 w-full" /></td></tr>
                ))
              ) : contacts.length > 0 ? (
                contacts.map(contact => (
                  <tr key={contact.id} className="border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--secondary)/0.3)]">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleSelect(contact.id)} className="rounded" /></td>
                    <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))]">{contact.email}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{[contact.firstName, contact.lastName].filter(Boolean).join(' ') || '—'}</td>
                    <td className="hidden px-4 py-3 text-[hsl(var(--muted-foreground))] md:table-cell">{contact.company || '—'}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">{contact.groupName ? <span className="rounded-md bg-[hsl(var(--primary)/0.1)] px-2 py-0.5 text-xs text-[hsl(var(--primary))]">{contact.groupName}</span> : '—'}</td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${contact.status === 'ACTIVE' ? 'badge-success' : contact.status === 'BOUNCED' ? 'badge-error' : 'badge-warning'}`}>{contact.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(contact)} className="rounded-lg p-1.5 hover:bg-[hsl(var(--secondary))]"><Edit className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /></button>
                        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(contact.id); }} className="rounded-lg p-1.5 hover:bg-[hsl(var(--destructive)/0.1)]"><Trash2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Users className="mx-auto mb-3 h-12 w-12 text-[hsl(var(--muted-foreground)/0.3)]" />
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">No contacts found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="rounded-lg border border-[hsl(var(--border))] p-1.5 hover:bg-[hsl(var(--secondary))] disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="rounded-lg border border-[hsl(var(--border))] p-1.5 hover:bg-[hsl(var(--secondary))] disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={`${editingContact ? 'Edit' : 'Add'} Contact`} maxWidth="max-w-md">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium">Email *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium">First Name</label><input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium">Last Name</label><input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className={inputClass} /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium">Company</label><input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium">Phone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} /></div>
            <div><label className="mb-1 block text-sm font-medium">Group</label><input value={form.groupName} onChange={e => setForm(p => ({ ...p, groupName: e.target.value }))} className={inputClass} placeholder="e.g., newsletter" /></div>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--secondary))]">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex flex-1 items-center justify-center rounded-xl gradient-primary py-2.5 text-sm font-medium text-white disabled:opacity-50">{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingContact ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import Contacts" maxWidth="max-w-md">
        <form onSubmit={handleImport} className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-[hsl(var(--border))] p-8 text-center">
            <Upload className="mx-auto mb-3 h-10 w-10 text-[hsl(var(--muted-foreground)/0.5)]" />
            <p className="mb-2 text-sm font-medium">Upload Excel or CSV file</p>
            <p className="mb-4 text-xs text-[hsl(var(--muted-foreground))]">Columns: email, firstName, lastName, company, phone, group, tags</p>
            <input type="file" name="file" accept=".csv,.xlsx,.xls" required className="mx-auto block text-sm" />
          </div>
          <div><label className="mb-1 block text-sm font-medium">Assign to Group (optional)</label><input name="groupName" className={inputClass} placeholder="e.g., newsletter-july" /></div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={() => setShowImport(false)} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--secondary))]">Cancel</button>
            <button type="submit" disabled={importMutation.isPending} className="flex flex-1 items-center justify-center rounded-xl gradient-primary py-2.5 text-sm font-medium text-white disabled:opacity-50">{importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
