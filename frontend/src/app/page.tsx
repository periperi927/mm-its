'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import CCTVStreamPlayer from '@/components/dashboard/CCTVStreamPlayer';
import GreenWavePanel from '@/components/dashboard/GreenWavePanel';
import SignalStatusCard from '@/components/dashboard/SignalStatusCard';
import TicketTable from '@/components/dashboard/TicketTable';
import SignalOverridePanel from '@/components/dashboard/SignalOverridePanel';

// Import TrafficMap dynamically without SSR
const TrafficMap = dynamic(() => import('@/components/map/TrafficMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-its-blue-950 rounded-xl border-2 border-its-yellow-500/30 flex items-center justify-center text-its-yellow-400 font-bold">
      Loading Traffic Map...
    </div>
  ),
});

export default function OperationsDashboard() {
  return (
    <div className="min-h-screen bg-its-blue-950 text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Header Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-its-yellow-500/20 pb-4">
            <div>
              <h1 className="text-2xl font-black text-its-yellow-400 tracking-tight flex items-center gap-2">
                <span>Live Traffic Operations Command</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                  System Nominal
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-semibold mt-1">
                Metro Manila Intelligent Transport System — Real-Time Signal Telemetry & Dispatch
              </p>
            </div>

            {/* Quick Metrics Header Bar */}
            <div className="flex items-center gap-3">
              <div className="bg-its-blue-900 border border-its-yellow-500/30 px-3.5 py-2 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Signals</p>
                <p className="text-lg font-black text-its-yellow-400">128</p>
              </div>
              <div className="bg-its-blue-900 border border-its-yellow-500/30 px-3.5 py-2 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Active Corridors</p>
                <p className="text-lg font-black text-emerald-400">3</p>
              </div>
              <div className="bg-its-blue-900 border border-its-yellow-500/30 px-3.5 py-2 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Dispatches Today</p>
                <p className="text-lg font-black text-its-red-500">14</p>
              </div>
            </div>
          </div>

          {/* Signal Override Real-Time Control Panel */}
          <SignalOverridePanel />

          {/* Top Row: Live AI CCTV Stream Player + Emergency Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* AI Video Feed */}
              <CCTVStreamPlayer
                cameraId="CAM_EDSA_ORTIGAS_01"
                locationName="EDSA Northbound - Ortigas Flyover"
              />
              {/* Traffic Map Below CCTV Stream */}
              <TrafficMap />
            </div>
            <div className="flex justify-center lg:justify-end">
              <GreenWavePanel />
            </div>
          </div>

          {/* Bottom Row: Active Signal Telemetry Cards + LTO / STS Ticketing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-its-yellow-400">
                  Priority Intersection Telemetry
                </h2>
                <span className="text-xs text-slate-400 font-semibold">
                  Auto-refreshing (5s interval)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SignalStatusCard
                  telemetry={{
                    signalId: 'SIG_EDSA_ORTIGAS_01',
                    intersectionName: 'EDSA - Ortigas Flyover',
                    currentPhase: 'GREEN',
                    timeRemainingSec: 18,
                    queueLengthVehicles: 24,
                    isOverrideActive: false,
                  }}
                />
                <SignalStatusCard
                  telemetry={{
                    signalId: 'SIG_EDSA_SHAW_02',
                    intersectionName: 'EDSA - Shaw Blvd Underpass',
                    currentPhase: 'RED',
                    timeRemainingSec: 42,
                    queueLengthVehicles: 38,
                    isOverrideActive: true,
                  }}
                />
              </div>
            </div>

            {/* Single Ticketing System (STS) Table */}
            <div className="lg:col-span-1">
              <TicketTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}