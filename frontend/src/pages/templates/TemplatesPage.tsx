/**
 * Templates Page
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '@/services/data.service';
import { Modal } from '@/components/ui/Modal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Template } from '@/types';
import { Plus, FileText, Trash2, Edit, Eye, X, Loader2, Code, Type } from 'lucide-react';

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', htmlContent: '', textContent: '', type: 'HTML' as 'HTML' | 'PLAIN' });

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => { const res = await templatesApi.getAll(); return res.data.data; },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editingTemplate ? templatesApi.update(editingTemplate.id, data) : templatesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); toast.success(editingTemplate ? 'Updated' : 'Created'); resetForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); toast.success('Deleted'); },
  });

  const resetForm = () => { setForm({ name: '', subject: '', htmlContent: '', textContent: '', type: 'HTML' }); setShowForm(false); setEditingTemplate(null); };

  const handleEdit = (template: Template) => {
    setForm({ name: template.name, subject: template.subject, htmlContent: template.htmlContent || '', textContent: template.textContent || '', type: template.type });
    setEditingTemplate(template);
    setShowForm(true);
  };

  const templates = templatesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Templates</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Email templates with variable support</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] hover:opacity-90"><Plus className="h-4 w-4" /> New Template</button>
      </div>

      {/* Template Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: Template, index: number) => (
            <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="card-hover flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--accent)/0.1)]">
                    {template.type === 'HTML' ? <Code className="h-5 w-5 text-[hsl(var(--accent))]" /> : <Type className="h-5 w-5 text-[hsl(var(--accent))]" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{template.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{template.type}</p>
                  </div>
                </div>
              </div>
              <p className="mb-3 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">{template.subject}</p>
              <p className="mb-4 text-xs text-[hsl(var(--muted-foreground)/0.7)]">Created {new Date(template.createdAt).toLocaleDateString()}</p>
              <div className="mt-auto flex items-center gap-1.5 border-t border-[hsl(var(--border))] pt-3">
                <button onClick={() => handleEdit(template)} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" title="Edit"><Edit className="h-4 w-4" /></button>
                <button onClick={() => setPreviewHtml(template.htmlContent || template.textContent || '')} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]" title="Preview"><Eye className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(template.id); }} className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)]" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] py-16">
          <FileText className="mb-3 h-12 w-12 text-[hsl(var(--muted-foreground)/0.3)]" />
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No templates yet</p>
          <button onClick={() => setShowForm(true)} className="mt-4 flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Create Template</button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={`${editingTemplate ? 'Edit' : 'Create'} Template`} maxWidth="max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-sm font-medium">Template Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" required /></div>
            <div><label className="mb-1 block text-sm font-medium">Type</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm outline-none"><option value="HTML">HTML</option><option value="PLAIN">Plain Text</option></select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium">Subject *</label><input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="Hello {{name}}!" required /></div>
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] p-2 text-xs text-[hsl(var(--muted-foreground))]">
            Variables: <code className="text-[hsl(var(--primary))]">{'{{name}}'}</code> <code className="text-[hsl(var(--primary))]">{'{{email}}'}</code> <code className="text-[hsl(var(--primary))]">{'{{company}}'}</code> <code className="text-[hsl(var(--primary))]">{'{{phone}}'}</code> <code className="text-[hsl(var(--primary))]">{'{{firstName}}'}</code> <code className="text-[hsl(var(--primary))]">{'{{lastName}}'}</code>
          </div>
          {form.type === 'HTML' ? (
            <div><label className="mb-1 block text-sm font-medium">HTML Content</label><textarea value={form.htmlContent} onChange={e => setForm(p => ({ ...p, htmlContent: e.target.value }))} className="min-h-[200px] w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3 font-mono text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="<h1>Hello {{name}}</h1>" /></div>
          ) : (
            <div><label className="mb-1 block text-sm font-medium">Text Content</label><textarea value={form.textContent} onChange={e => setForm(p => ({ ...p, textContent: e.target.value }))} className="min-h-[200px] w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" placeholder="Hello {{name}}," /></div>
          )}
          <div className="flex gap-3 pt-4 mt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={resetForm} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium hover:bg-[hsl(var(--secondary))]">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex flex-1 items-center justify-center rounded-xl gradient-primary py-2.5 text-sm font-medium text-white disabled:opacity-50">{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTemplate ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={previewHtml !== null} onClose={() => setPreviewHtml(null)} title="Template Preview" maxWidth="max-w-3xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-black" dangerouslySetInnerHTML={{ __html: previewHtml || '' }} />
      </Modal>
    </div>
  );
}
