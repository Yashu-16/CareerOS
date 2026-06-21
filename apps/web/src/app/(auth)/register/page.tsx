'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ fullName, email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-semibold text-ink-800">
            CareerOS
          </Link>
          <p className="mt-1 text-sm text-ink-400">Upload your profile once. We'll handle the rest.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Takes less than a minute.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ananya Sharma"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              {register.isError && (
                <p className="text-sm text-alert-500">
                  {(register.error as any)?.response?.data?.message || 'Could not create account.'}
                </p>
              )}

              <Button type="submit" variant="accent" className="w-full" disabled={register.isPending}>
                {register.isPending ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-ink-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-ink-800 hover:text-saffron-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
