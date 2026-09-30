'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

export default function TicketTable() {
  const [licenseNo, setLicenseNo] = useState('');
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNo) return;
    setLoading(true);
    try {
      const res = await api.get(`/tickets/driver/${licenseNo}`);
      setDriverInfo(res.data);
    } catch (err) {
      alert('Driver not found or LTO API offline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-its-blue-900 text-white p-6 rounded-xl border-2 border-its-yellow-500/40 shadow-2xl">
      <h2 className="text-xl font-bold text-its-yellow-400 mb-4 flex items-center gap-2">
        <span>Single Ticketing System</span>
        <span className="text-xs bg-its-red-600 text-white px-2 py-0.5 rounded font-semibold">LTO Live</span>
      </h2>
      
      <form onSubmit={handleLookup} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter Driver License No. (e.g., N01-12-345678)"
          value={licenseNo}
          onChange={(e) => setLicenseNo(e.target.value)}
          className="flex-1 bg-its-blue-950 border border-its-blue-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-its-yellow-400"
        />
        {/* Yellow Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-its-yellow-500 hover:bg-its-yellow-400 text-its-blue-950 font-bold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50 shadow-md shadow-its-yellow-500/20"
        >
          {loading ? 'Searching...' : 'LTO Lookup'}
        </button>
      </form>

      {driverInfo && (
        <div className="bg-its-blue-950 p-4 rounded-lg border border-its-blue-700 text-sm space-y-2">
          <p><strong className="text-its-yellow-400">Driver Name:</strong> {driverInfo.full_name}</p>
          <p><strong className="text-its-yellow-400">License Status:</strong> <span className="text-emerald-400 font-semibold">{driverInfo.status}</span></p>
          <p><strong className="text-its-yellow-400">Total Demerit Points:</strong> <span className="text-its-red-500 font-extrabold">{driverInfo.demerit_points}</span></p>
        </div>
      )}
    </div>
  );
}