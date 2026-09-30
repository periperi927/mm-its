'use client';

import React, { useState } from 'react';

interface EmergencyCorridor {
  id: string;
  name: string;
  code: string;
  intersectionsCount: number;
  activeUnit?: string;
  status: 'IDLE' | 'ACTIVE' | 'CLEARING';
}

const PRESET_CORRIDORS: EmergencyCorridor[] = [
  { id: 'CORR_EDSA_NORTH', name: 'EDSA Northbound (Cubao -> Balintawak)', code: 'ALPHA-1', intersectionsCount: 14, status: 'IDLE' },
  { id: 'CORR_EDSA_SOUTH', name: 'EDSA Southbound (Ortigas -> Pasay)', code: 'ALPHA-2', intersectionsCount: 12, status: 'IDLE' },
  { id: 'CORR_C5_SOUTH', name: 'C-5 Corridor (Libis -> BGC)', code: 'BRAVO-1', intersectionsCount: 8, status: 'IDLE' },
  { id: 'CORR_QUEZON_AVE', name: 'Quezon Ave (QC Circle -> Welcome Rotonda)', code: 'CHARLIE-1', intersectionsCount: 9, status: 'IDLE' },
];

export default function GreenWavePanel() {
  const [corridors, setCorridors] = useState<EmergencyCorridor[]>(PRESET_CORRIDORS);
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(PRESET_CORRIDORS[0].id);
  const [dispatchUnit, setDispatchUnit] = useState('AMB-911-PHILHEALTH');
  const [emergencyType, setEmergencyType] = useState('MEDICAL_TRANSPORT');
  const [holdTimeMinutes, setHoldTimeMinutes] = useState(10);
  const [isActivating, setIsActivating] = useState(false);

  const activeCorridor = corridors.find((c) => c.status === 'ACTIVE');

  const handleToggleCorridor = (id: string) => {
    setIsActivating(true);

    setTimeout(() => {
      setCorridors((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const isNowActive = c.status !== 'ACTIVE';
            return {
              ...c,
              status: isNowActive ? 'ACTIVE' : 'IDLE',
              activeUnit: isNowActive ? dispatchUnit : undefined,
            };
          }
          // Deactivate any other active corridor to avoid conflicting signals
          return { ...c, status: 'IDLE', activeUnit: undefined };
        })
      );
      setIsActivating(false);
    }, 1000);
  };

  const handleClearAllOverriding = () => {
    setCorridors((prev) => prev.map((c) => ({ ...c, status: 'IDLE', activeUnit: undefined })));
  };

  return (
    <div className="w-full max-w-md bg-its-blue-900 border border-its-yellow-500/30 rounded-2xl p-5 text-white shadow-xl flex flex-col justify-between">
      <div>
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-its-yellow-500/20 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-black text-its-yellow-400 tracking-wide uppercase flex items-center gap-2">
              <span>Green Wave Preemption</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded font-mono font-bold">
                PRIORITY 0
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Emergency Signal Corridor Control & Priority Dispatch
            </p>
          </div>
        </div>

        {/* Global Alert Banner when Active */}
        {activeCorridor ? (
          <div className="bg-emerald-950/80 border border-emerald-500 p-3 rounded-xl mb-4 animate-pulse">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                Green Wave Active
              </span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded">
                HOLD: {holdTimeMinutes} MIN
              </span>
            </div>
            <p className="text-xs text-white font-bold">{activeCorridor.name}</p>
            <p className="text-[11px] text-slate-300 font-mono mt-1">
              Unit: <strong className="text-its-yellow-400">{activeCorridor.activeUnit}</strong> | Intersections: {activeCorridor.intersectionsCount} Signals Locked Green
            </p>
          </div>
        ) : (
          <div className="bg-its-blue-950/80 border border-slate-800 p-3 rounded-xl mb-4 text-center">
            <p className="text-xs text-slate-400 font-semibold">
              No active preemption corridors. Signals operating on normal adaptive timing.
            </p>
          </div>
        )}

        {/* Corridor Selector */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Select Target Corridor
            </label>
            <select
              value={selectedCorridorId}
              onChange={(e) => setSelectedCorridorId(e.target.value)}
              disabled={!!activeCorridor}
              className="w-full bg-its-blue-950 border border-its-yellow-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-its-yellow-400 disabled:opacity-50"
            >
              {corridors.map((c) => (
                <option key={c.id} value={c.id} className="bg-its-blue-950 text-white">
                  [{c.code}] {c.name} ({c.intersectionsCount} Signals)
                </option>
              ))}
            </select>
          </div>

          {/* Emergency Vehicle / Dispatch Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Dispatch Call Sign
              </label>
              <input
                type="text"
                value={dispatchUnit}
                onChange={(e) => setDispatchUnit(e.target.value)}
                disabled={!!activeCorridor}
                className="w-full bg-its-blue-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-its-yellow-400 focus:outline-none focus:border-its-yellow-400 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Emergency Type
              </label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                disabled={!!activeCorridor}
                className="w-full bg-its-blue-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-its-yellow-400 disabled:opacity-50"
              >
                <option value="MEDICAL_TRANSPORT">Ambulance / 911</option>
                <option value="FIRE_RESPONSE">BFP Fire Response</option>
                <option value="VIP_CONVOY">VIP / Presidential Security</option>
                <option value="DISASTER_RELIEF">Disaster Convoy</option>
              </select>
            </div>
          </div>

          {/* Preemption Timeout Setting */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Override Window Duration
              </label>
              <span className="text-xs font-mono font-bold text-its-yellow-400">
                {holdTimeMinutes} minutes
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={holdTimeMinutes}
              onChange={(e) => setHoldTimeMinutes(Number(e.target.value))}
              disabled={!!activeCorridor}
              className="w-full accent-its-yellow-500 bg-its-blue-950 rounded-lg cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-2">
        {activeCorridor ? (
          <button
            onClick={handleClearAllOverriding}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition shadow-lg shadow-rose-950/50 uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>Cancel Active Corridor Preemption</span>
          </button>
        ) : (
          <button
            onClick={() => handleToggleCorridor(selectedCorridorId)}
            disabled={isActivating}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition shadow-lg shadow-emerald-950/50 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isActivating ? (
              <span>Transmitting Signals to Controllers...</span>
            ) : (
              <span>Initiate Green Wave Lock</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}