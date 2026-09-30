'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { api } from '@/lib/api';

const administratorUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';

interface Member {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (error.response?.status === 403) return 'Only the group administrator can manage accounts.';
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadMembers() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<Member[]>('/api/v1/auth/members');
      setMembers(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/api/v1/auth/members', {
        username,
        email,
        full_name: fullName || null,
        password,
      });
      setUsername('');
      setEmail('');
      setFullName('');
      setPassword('');
      setMessage('Account created. Share the temporary password with the member privately.');
      await loadMembers();
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function setMemberActive(member: Member) {
    setError('');
    setMessage('');
    try {
      const response = await api.patch<Member>(`/api/v1/auth/members/${encodeURIComponent(member.username)}`, {
        is_active: !member.is_active,
      });
      setMembers((current) =>
        current.map((item) => item.id === response.data.id ? response.data : item)
      );
    } catch (statusError) {
      setError(errorMessage(statusError));
    }
  }

  return (
    <main className="min-h-screen bg-its-blue-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-its-yellow-500/30 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-its-yellow-400">MM-ITS private access</p>
            <h1 className="mt-1 text-2xl font-black">Group member accounts</h1>
            <p className="mt-1 text-sm text-slate-300">Create, review, or disable individual member access.</p>
          </div>
          <Link href="/" className="rounded-lg border border-its-blue-700 px-4 py-2 text-sm font-bold hover:bg-its-blue-900">
            Back to dashboard
          </Link>
        </header>

        {error && <p role="alert" className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        {message && <p role="status" className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}

        <section className="rounded-2xl border border-its-yellow-500/30 bg-its-blue-900 p-5 shadow-xl">
          <h2 className="text-lg font-bold text-its-yellow-400">Create member account</h2>
          <form onSubmit={createMember} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">
              Username
              <input required minLength={3} maxLength={50} autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg border border-its-blue-700 bg-its-blue-950 px-3 py-2 text-white" />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Email
              <input required type="email" maxLength={100} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-its-blue-700 bg-its-blue-950 px-3 py-2 text-white" />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Full name (optional)
              <input maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-lg border border-its-blue-700 bg-its-blue-950 px-3 py-2 text-white" />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              Initial password (12+ characters)
              <input required type="password" minLength={12} maxLength={72} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-its-blue-700 bg-its-blue-950 px-3 py-2 text-white" />
            </label>
            <button disabled={saving} className="rounded-lg bg-its-yellow-500 px-4 py-3 font-black text-its-blue-950 hover:bg-its-yellow-400 disabled:opacity-60 sm:col-span-2">
              {saving ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-its-blue-700 bg-its-blue-900">
          <div className="border-b border-its-blue-700 px-5 py-4">
            <h2 className="text-lg font-bold">Current accounts</h2>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-slate-300">Loading accounts…</p>
          ) : members.length === 0 ? (
            <p className="p-5 text-sm text-slate-300">No accounts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-its-blue-950 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Access</th>
                    <th className="px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t border-its-blue-800">
                      <td className="px-5 py-4">
                        <div className="font-bold">{member.full_name || member.username}</div>
                        {member.full_name && <div className="text-xs text-slate-400">{member.username}</div>}
                      </td>
                      <td className="px-5 py-4 text-slate-300">{member.email}</td>
                      <td className="px-5 py-4">
                        <span className={member.is_active ? 'text-emerald-300' : 'text-rose-300'}>
                          {member.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {member.username === administratorUsername ? (
                          <span className="text-slate-400">Administrator</span>
                        ) : (
                          <button onClick={() => void setMemberActive(member)} className="font-bold text-its-yellow-400 hover:text-its-yellow-300">
                            {member.is_active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
