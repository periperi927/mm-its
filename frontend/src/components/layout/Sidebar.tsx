'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Live Operations',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Single Ticketing (STS)',
      href: '/tickets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
        </svg>
      ),
    },
    {
      label: 'Green Wave Override',
      href: '/emergency',
      badge: 'RED',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 bg-its-blue-950 border-r-2 border-its-yellow-500/30 text-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      {/* Navigation Links */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase font-bold tracking-widest text-its-yellow-400/80 px-3 mb-2">
          Control Center Modules
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-its-blue-900 text-its-yellow-400 border-l-4 border-its-yellow-400 shadow-lg shadow-its-blue-900/50'
                  : 'text-slate-300 hover:bg-its-blue-900/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-its-yellow-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge === 'RED' && (
                <span className="bg-its-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  Priority
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Meta Box */}
      <div className="bg-its-blue-900/70 p-3.5 rounded-xl border border-its-yellow-500/20 text-xs space-y-1">
        <p className="font-bold text-its-yellow-400">Metro Manila ITS v1.0</p>
        <p className="text-[11px] text-slate-400">MMDA / LTO Connected API</p>
      </div>
    </aside>
  );
}