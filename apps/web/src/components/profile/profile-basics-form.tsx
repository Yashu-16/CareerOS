'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { useUpdateProfile } from '@/hooks/use-profile';

const INDIAN_CITIES = [
  'Mumbai', 'Pune', 'Bengaluru', 'Hyderabad', 'Chennai', 'Delhi NCR', 'Kolkata',
  'Ahmedabad', 'Jaipur', 'Nagpur', 'Indore', 'Surat', 'Chandigarh', 'Kochi', 'Lucknow',
];

export function ProfileBasicsForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    currentCity: profile.currentCity || '',
    headline: profile.headline || '',
    summary: profile.summary || '',
    linkedinUrl: profile.linkedinUrl || '',
    githubUrl: profile.githubUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    careerGoals: profile.careerGoals || '',
    expectedSalaryMinLpa: profile.expectedSalaryMinLpa?.toString() || '',
    expectedSalaryMaxLpa: profile.expectedSalaryMaxLpa?.toString() || '',
  });
  const [preferredLocations, setPreferredLocations] = useState<string[]>(profile.preferredLocations || []);

  useEffect(() => {
    setForm({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      currentCity: profile.currentCity || '',
      headline: profile.headline || '',
      summary: profile.summary || '',
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      careerGoals: profile.careerGoals || '',
      expectedSalaryMinLpa: profile.expectedSalaryMinLpa?.toString() || '',
      expectedSalaryMaxLpa: profile.expectedSalaryMaxLpa?.toString() || '',
    });
    setPreferredLocations(profile.preferredLocations || []);
  }, [profile]);

  const toggleLocation = (city: string) => {
    setPreferredLocations((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  };

  const onSave = () => {
    update.mutate({
      ...form,
      expectedSalaryMinLpa: form.expectedSalaryMinLpa ? parseFloat(form.expectedSalaryMinLpa) : undefined,
      expectedSalaryMaxLpa: form.expectedSalaryMaxLpa ? parseFloat(form.expectedSalaryMaxLpa) : undefined,
      preferredLocations,
    } as any);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentCity">Current city</Label>
            <Input id="currentCity" value={form.currentCity} onChange={(e) => setForm({ ...form, currentCity: e.target.value })} placeholder="Bengaluru" />
          </div>
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Frontend Engineer | React, TypeScript" />
          </div>
        </div>

        <div>
          <Label htmlFor="summary">Professional summary</Label>
          <Textarea id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="linkedinUrl">LinkedIn</Label>
            <Input id="linkedinUrl" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="githubUrl">GitHub</Label>
            <Input id="githubUrl" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="portfolioUrl">Portfolio</Label>
            <Input id="portfolioUrl" value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} />
          </div>
        </div>

        <div>
          <Label>Preferred locations</Label>
          <div className="flex flex-wrap gap-2">
            {INDIAN_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => toggleLocation(city)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  preferredLocations.includes(city)
                    ? 'border-saffron-500 bg-saffron-50 text-saffron-700'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expectedSalaryMinLpa">Expected salary — min (LPA)</Label>
            <Input
              id="expectedSalaryMinLpa"
              type="number"
              value={form.expectedSalaryMinLpa}
              onChange={(e) => setForm({ ...form, expectedSalaryMinLpa: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="expectedSalaryMaxLpa">Expected salary — max (LPA)</Label>
            <Input
              id="expectedSalaryMaxLpa"
              type="number"
              value={form.expectedSalaryMaxLpa}
              onChange={(e) => setForm({ ...form, expectedSalaryMaxLpa: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="careerGoals">Career goals</Label>
          <Textarea id="careerGoals" value={form.careerGoals} onChange={(e) => setForm({ ...form, careerGoals: e.target.value })} rows={2} />
        </div>

        <Button onClick={onSave} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save basics'}
        </Button>
      </CardContent>
    </Card>
  );
}
