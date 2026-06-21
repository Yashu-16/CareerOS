'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProfileSkill } from '@/types';
import { useAddSkill, useRemoveSkill } from '@/hooks/use-profile';

export function SkillsSection({ skills }: { skills: ProfileSkill[] }) {
  const [skillInput, setSkillInput] = useState('');
  const add = useAddSkill();
  const remove = useRemoveSkill();

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    add.mutate({ name: skillInput.trim(), proficiency: 'INTERMEDIATE' });
    setSkillInput('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onAdd} className="mb-4 flex gap-2">
          <Input
            placeholder="Add a skill (e.g. React, SQL, Figma) and press Enter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
          />
        </form>

        {skills.length === 0 && <p className="text-sm text-ink-400">No skills added yet.</p>}

        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s.skill.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-sm text-ink-700"
            >
              {s.skill.name}
              <button onClick={() => remove.mutate(s.skill.id)} aria-label={`Remove ${s.skill.name}`}>
                <X className="h-3 w-3 text-ink-300 hover:text-alert-500" />
              </button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
