'use client';

import { useSession, signOut } from 'next-auth/react';

export default function UserBadge() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="text-xs text-slate-400 animate-pulse">
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-xs text-rose-400 font-semibold">
        Not authenticated
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-its-blue-900 border border-its-blue-700/60 rounded-xl px-3 py-1.5">
      <div className="text-right">
        <p className="text-xs font-bold text-white">
          {session.user?.name || 'Operator'}
        </p>
        <p className="text-[10px] text-its-yellow-400 font-mono">
          {session.user?.email || 'Active Duty'}
        </p>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold px-2 py-1 rounded-lg border border-rose-500/30 transition"
      >
        Sign Out
      </button>
    </div>
  );
}