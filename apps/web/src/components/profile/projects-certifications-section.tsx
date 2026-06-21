'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProjectEntry, Certification } from '@/types';
import { useAddProject, useDeleteProject, useAddCertification, useDeleteCertification } from '@/hooks/use-profile';

export function ProjectsSection({ projects }: { projects: ProjectEntry[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', techStack: '', projectUrl: '', repoUrl: '' });
  const add = useAddProject();
  const remove = useDeleteProject();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    add.mutate(
      { ...form, techStack: form.techStack.split(',').map((t) => t.trim()).filter(Boolean) } as any,
      {
        onSuccess: () => {
          setForm({ name: '', description: '', techStack: '', projectUrl: '', repoUrl: '' });
          setIsAdding(false);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projects</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-ink-100 p-4">
            <Input placeholder="Project name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Tech stack (comma-separated)" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Live URL" value={form.projectUrl} onChange={(e) => setForm({ ...form, projectUrl: e.target.value })} />
              <Input placeholder="Repo URL" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} />
            </div>
            <Button type="submit" size="sm" disabled={add.isPending}>Save</Button>
          </form>
        )}

        {projects.length === 0 && !isAdding && <p className="text-sm text-ink-400">No projects added yet.</p>}

        {projects.map((proj) => (
          <div key={proj.id} className="flex items-start justify-between rounded-lg border border-ink-100 p-3">
            <div>
              <p className="font-medium text-ink-800">{proj.name}</p>
              <p className="text-sm text-ink-500">{proj.description}</p>
              {proj.techStack.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {proj.techStack.map((t) => (
                    <span key={t} className="skill-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(proj.id)}>
              <Trash2 className="h-4 w-4 text-ink-300 hover:text-alert-500" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CertificationsSection({ certifications }: { certifications: Certification[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', issuer: '', credentialUrl: '' });
  const add = useAddCertification();
  const remove = useDeleteCertification();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    add.mutate(form as any, {
      onSuccess: () => {
        setForm({ name: '', issuer: '', credentialUrl: '' });
        setIsAdding(false);
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Certifications</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-ink-100 p-4">
            <Input placeholder="Certification name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
            <Input placeholder="Credential URL" value={form.credentialUrl} onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })} />
            <Button type="submit" size="sm" disabled={add.isPending}>Save</Button>
          </form>
        )}

        {certifications.length === 0 && !isAdding && <p className="text-sm text-ink-400">No certifications added yet.</p>}

        {certifications.map((cert) => (
          <div key={cert.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
            <div>
              <p className="font-medium text-ink-800">{cert.name}</p>
              {cert.issuer && <p className="text-sm text-ink-500">{cert.issuer}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(cert.id)}>
              <Trash2 className="h-4 w-4 text-ink-300 hover:text-alert-500" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
