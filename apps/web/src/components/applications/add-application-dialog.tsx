'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { useCreateApplication } from '@/hooks/use-applications';

export function AddApplicationDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ companyName: '', jobTitle: '', jobUrl: '', salaryLpa: '' });
  const create = useCreateApplication();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, salaryLpa: form.salaryLpa ? parseFloat(form.salaryLpa) : undefined } as any,
      {
        onSuccess: () => {
          setForm({ companyName: '', jobTitle: '', jobUrl: '', salaryLpa: '' });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="accent" size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add application
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-900/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-cardHover">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-display text-lg font-semibold text-ink-800">
              Add application
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close"><X className="h-4 w-4 text-ink-400" /></button>
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="companyName">Company</Label>
              <Input id="companyName" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" required value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="jobUrl">Job URL</Label>
              <Input id="jobUrl" value={form.jobUrl} onChange={(e) => setForm({ ...form, jobUrl: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="salaryLpa">Salary (LPA)</Label>
              <Input id="salaryLpa" type="number" value={form.salaryLpa} onChange={(e) => setForm({ ...form, salaryLpa: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Add to tracker'}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
