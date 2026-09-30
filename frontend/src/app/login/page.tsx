'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Calls NextAuth Credentials provider handler
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg('Invalid username or password. Please try again.');
        setIsLoading(false);
      } else {
        // Authenticated successfully - redirect to dashboard
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred during authentication.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-its-blue-950 flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-its-blue-800/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-its-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-its-blue-900 border-2 border-its-yellow-500/40 rounded-2xl p-8 max-w-md w-full shadow-2xl relative z-10 space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-its-yellow-500 text-its-blue-950 font-black text-xl shadow-lg shadow-its-yellow-500/20 mb-2">
            ITS
          </div>
          <h1 className="text-2xl font-black text-its-yellow-400 tracking-tight">
            Traffic Operations Portal
          </h1>
          <p className="text-xs text-slate-300 font-semibold">
            Metro Manila Intelligent Transport & Enforcement Command
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="bg-its-red-600/20 border border-its-red-600 text-its-red-500 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-its-red-500 animate-pulse"></span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
              Operator Badge / Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or officer_id"
              className="w-full bg-its-blue-950 border border-its-blue-700/80 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-its-yellow-400 font-medium transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
              Security Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-its-blue-950 border border-its-blue-700/80 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-its-yellow-400 font-medium transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-its-yellow-500 hover:bg-its-yellow-400 text-its-blue-950 font-black py-3 rounded-lg transition uppercase tracking-wider text-xs shadow-lg shadow-its-yellow-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-its-blue-950 border-t-transparent rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              'Access Operations Command'
            )}
          </button>
        </form>

        {/* Account access guidance */}
        <div className="pt-2 border-t border-its-blue-700/50 text-[11px] text-slate-400 text-center">
          <p>Group accounts are created by the MM-ITS administrator.</p>
        </div>
      </div>
    </div>
  );
}