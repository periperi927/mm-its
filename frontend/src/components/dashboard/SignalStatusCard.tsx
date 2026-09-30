'use client';

import React, { useState } from 'react';

interface SignalTelemetry {
  signalId: string;
  intersectionName: string;
  currentPhase: 'GREEN' | 'YELLOW' | 'RED' | 'OVERRIDE';
  timeRemainingSec: number;
  queueLengthVehicles: number;
  isOverrideActive: boolean;
}

interface SignalStatusCardProps {
  telemetry?: SignalTelemetry;
}

export default function SignalStatusCard({ telemetry }: SignalStatusCardProps) {
  // Default fallback data for demonstration or isolated testing
  const data: SignalTelemetry = telemetry || {
    signalId: 'SIG_EDSA_ORTIGAS_01',
    intersectionName: 'EDSA - Ortigas Intersection',
    currentPhase: 'GREEN',
    timeRemainingSec: 24,
    queueLengthVehicles: 18,
    isOverrideActive: false,
  };

  const [phase, setPhase] = useState(data.currentPhase);
  const [isOverride, setIsOverride] = useState(data.isOverrideActive);

  const toggleManualOverride = () => {
    if (isOverride) {
      setIsOverride(false);
      setPhase('GREEN');
    } else {
      setIsOverride(true);
      setPhase('OVERRIDE');
    }
  };

  return (
    <div className="bg-its-blue-900 text-white p-5 rounded-xl border-2 border-its-yellow-500/40 shadow-2xl max-w-sm w-full">
      {/* Header & Status Badge */}
      <div className="flex items-start justify-between mb-3 border-b border-its-blue-700/50 pb-2.5">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-its-yellow-400">
            {data.signalId}
          </p>
          <h3 className="text-base font-extrabold text-white leading-snug">
            {data.intersectionName}
          </h3>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-md ${
            isOverride
              ? 'bg-its-red-600 text-white animate-pulse'
              : 'bg-its-yellow-500 text-its-blue-950'
          }`}
        >
          {isOverride ? 'Manual Override' : 'Auto Cycle'}
        </span>
      </div>

      {/* Main Signal Display */}
      <div className="flex items-center gap-4 my-4 bg-its-blue-950 p-3.5 rounded-lg border border-its-blue-700/60">
        {/* Signal Light Housing */}
        <div className="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col gap-2 shadow-inner">
          <div
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              phase === 'RED'
                ? 'bg-its-red-500 shadow-[0_0_10px_#ef4444]'
                : 'bg-red-950/40'
            }`}
          />
          <div
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              phase === 'YELLOW'
                ? 'bg-its-yellow-400 shadow-[0_0_10px_#facc15]'
                : 'bg-yellow-950/40'
            }`}
          />
          <div
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              phase === 'GREEN' || phase === 'OVERRIDE'
                ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                : 'bg-emerald-950/40'
            }`}
          />
        </div>

        {/* Phase Readout & Timer */}
        <div className="flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Current Phase
          </p>
          <p
            className={`text-xl font-black ${
              phase === 'RED'
                ? 'text-its-red-500'
                : phase === 'YELLOW'
                ? 'text-its-yellow-400'
                : 'text-emerald-400'
            }`}
          >
            {phase}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white font-mono">
              {data.timeRemainingSec}
            </span>
            <span className="text-[11px] text-slate-400">sec remaining</span>
          </div>
        </div>
      </div>

      {/* Telemetry Details */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="bg-its-blue-950/70 p-2.5 rounded-lg border border-its-blue-700/40">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Queue Length</p>
          <p className="text-sm font-extrabold text-its-yellow-400">
            {data.queueLengthVehicles} <span className="text-[10px] text-slate-300 font-normal">veh</span>
          </p>
        </div>

        <div className="bg-its-blue-950/70 p-2.5 rounded-lg border border-its-blue-700/40">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Health Status</p>
          <p className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Optimal
          </p>
        </div>
      </div>

      {/* Manual Override Action Button */}
      <button
        onClick={toggleManualOverride}
        className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg ${
          isOverride
            ? 'bg-its-yellow-500 hover:bg-its-yellow-400 text-its-blue-950'
            : 'bg-its-red-600 hover:bg-its-red-500 text-white shadow-its-red-600/30'
        }`}
      >
        {isOverride ? 'Release Control to Auto' : 'Manual Signal Override'}
      </button>
    </div>
  );
}