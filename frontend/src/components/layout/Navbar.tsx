'use client';

import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const administratorUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';

  return (
    <header className="h-16 bg-its-blue-900 border-b-2 border-its-yellow-500/30 text-white px-6 flex items-center justify-between sticky top-0 z-50 shadow-xl">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-its-yellow-500 text-its-blue-950 font-black flex items-center justify-center text-xl shadow-md border border-its-yellow-400">
          MM
        </div>
        <div>
          <h1 className="text-lg font-black tracking-wide text-its-yellow-400 leading-tight">
            MM-ITS
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
            Intelligent Transport System
          </p>
        </div>
      </div>

      {/* System Quick Status Indicators */}
      <div className="hidden md:flex items-center gap-6 text-xs font-semibold">
        <div className="flex items-center gap-2 bg-its-blue-950/80 px-3 py-1.5 rounded-full border border-its-blue-700/60">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-200">Backend API:</span>
          <span className="text-emerald-400 font-bold">Online</span>
        </div>

        <div className="flex items-center gap-2 bg-its-blue-950/80 px-3 py-1.5 rounded-full border border-its-blue-700/60">
          <span className="w-2.5 h-2.5 rounded-full bg-its-yellow-400 animate-ping"></span>
          <span className="text-slate-200">Corridor Engine:</span>
          <span className="text-its-yellow-400 font-bold">Active</span>
        </div>

        {/* Emergency Trigger Counter / Pill */}
        <div className="flex items-center gap-2 bg-its-red-600/90 text-white px-3 py-1.5 rounded-full shadow-md shadow-its-red-600/20">
          <span className="font-bold uppercase tracking-wider text-[11px]">
            Emergency Overrides:
          </span>
          <span className="bg-white text-its-red-600 rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-black">
            0
          </span>
        </div>
      </div>

      {/* User Actions & Auth Profile */}
      <div className="flex items-center gap-4">
        {session?.user?.name === administratorUsername && (
          <Link
            href="/members"
            className="hidden rounded-lg border border-its-yellow-500/40 px-3 py-2 text-xs font-bold text-its-yellow-300 hover:bg-its-blue-800 sm:inline-flex"
          >
            Group accounts
          </Link>
        )}
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-its-yellow-400">{session?.user?.name || 'Operator'}</p>
          <p className="text-[10px] text-slate-300">Traffic Command Center</p>
        </div>

        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: '/login' })}
          className="bg-its-yellow-500 hover:bg-its-yellow-400 text-its-blue-950 font-bold text-xs px-4 py-2 rounded-lg transition shadow-md shadow-its-yellow-500/20 cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}