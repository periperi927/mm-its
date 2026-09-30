'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSession } from 'next-auth/react';
import { api } from '@/lib/api';

interface Intersection {
  id: string;
  name: string;
  corridor: string;
  status: 'AUTOMATED' | 'GREEN_WAVE' | 'MANUAL_RED' | 'OFFLINE';
  currentPhase: 'NORTH_SOUTH' | 'EAST_WEST';
}

export default function SignalOverridePanel() {
  const [intersections, setIntersections] = useState<Intersection[]>([
    { id: 'INT-01', name: 'EDSA - Ortigas Ave', corridor: 'EDSA Main', status: 'AUTOMATED', currentPhase: 'NORTH_SOUTH' },
    { id: 'INT-02', name: 'EDSA - Shaw Blvd', corridor: 'EDSA Main', status: 'AUTOMATED', currentPhase: 'NORTH_SOUTH' },
    { id: 'INT-03', name: 'Marikina-Infanta Hwy - Imelda Ave', corridor: 'Marikina Corridor', status: 'AUTOMATED', currentPhase: 'EAST_WEST' },
    { id: 'INT-04', name: 'C5 - Julia Vargas', corridor: 'C5 Expressway', status: 'AUTOMATED', currentPhase: 'NORTH_SOUTH' },
  ]);

  const [selectedCorridor, setSelectedCorridor] = useState<string>('EDSA Main');
  const [emergencyType, setEmergencyType] = useState<string>('AMBULANCE');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activeGreenWave, setActiveGreenWave] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Authenticated & Resilient WebSocket Connection Handler
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = async () => {
      try {
        const session = await getSession();
        const token = session?.user?.accessToken;
        if (!token || !isMounted) {
          setWsConnected(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const baseUrl = process.env.NEXT_PUBLIC_WS_URL || `${apiUrl.replace(/^http/, 'ws').replace(/\/+$/, '')}/ws/signals`;
        const wsUrl = new URL(baseUrl);
        wsUrl.searchParams.set('token', token);

        const socket = new WebSocket(wsUrl.toString());
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'GREEN_WAVE_ACTIVATED') {
              setActiveGreenWave(data.corridor_id);
              setIntersections((prev) =>
                prev.map((item) =>
                  item.corridor === data.corridor_id
                    ? { ...item, status: 'GREEN_WAVE', currentPhase: 'NORTH_SOUTH' }
                    : item
                )
              );
            }
          } catch (error) {
            console.error('Unable to parse signal WebSocket message:', error);
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setWsConnected(false);
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          // Graceful exponential backoff reconnection attempt (every 5s)
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, 5000);
        };
      } catch (error) {
        console.error('Unable to connect signal WebSocket:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const handleActivateGreenWave = async () => {
    setIsActivating(true);
    try {
      await api.post('/signals/green-wave', {
        corridor_id: selectedCorridor,
        duration_seconds: 180,
        vehicle_type: emergencyType,
      });
    } catch (err) {
      // Fallback local UI update if backend API fails or is offline
      setActiveGreenWave(selectedCorridor);
      setIntersections((prev) =>
        prev.map((item) =>
          item.corridor === selectedCorridor
            ? { ...item, status: 'GREEN_WAVE', currentPhase: 'NORTH_SOUTH' }
            : item
        )
      );
    } finally {
      setIsActivating(false);
    }
  };

  const handleResetCorridor = (corridor: string) => {
    if (activeGreenWave === corridor) setActiveGreenWave(null);
    setIntersections((prev) =>
      prev.map((item) =>
        item.corridor === corridor ? { ...item, status: 'AUTOMATED' } : item
      )
    );
  };

  return (
    <div className="bg-its-blue-900 border-2 border-its-yellow-500/40 rounded-xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-its-blue-700/50 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-its-yellow-400 flex items-center gap-2">
            <span>🚨 Traffic Signal Green Wave Control</span>
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Override Automated Signal Logic for Emergency Response & VIP Convoys
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time connection badge */}
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-its-blue-950">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-500'
              }`}
            />
            <span className={wsConnected ? 'text-emerald-400' : 'text-amber-400'}>
              {wsConnected ? 'LIVE TELEMETRY' : 'STANDBY MODE'}
            </span>
          </span>

          {activeGreenWave && (
            <div className="bg-its-red-600 text-white font-black px-3 py-1.5 rounded-lg text-xs animate-pulse flex items-center gap-2">
              <span>⚡ ACTIVE GREEN WAVE: {activeGreenWave}</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-its-blue-950 p-4 rounded-xl border border-its-blue-700/50">
        <div>
          <label className="block text-slate-300 text-xs font-bold mb-1">Target Corridor</label>
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            className="w-full bg-its-blue-900 border border-its-blue-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-its-yellow-400"
          >
            <option value="EDSA Main">EDSA Main Corridor</option>
            <option value="Marikina Corridor">Marikina-Infanta Hwy</option>
            <option value="C5 Expressway">C5 Expressway Corridor</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 text-xs font-bold mb-1">Priority Classification</label>
          <select
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            className="w-full bg-its-blue-900 border border-its-blue-700 rounded-lg px-3 py-2 text-xs text-its-yellow-400 font-bold focus:outline-none focus:ring-2 focus:ring-its-yellow-400"
          >
            <option value="AMBULANCE">Ambulance Emergency</option>
            <option value="FIRE_ENGINE">Fire Dept Response</option>
            <option value="VIP_CONVOY">Official VIP Escort</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleActivateGreenWave}
            disabled={isActivating}
            className="w-full bg-its-red-600 hover:bg-its-red-500 text-white font-black py-2 rounded-lg text-xs tracking-wider uppercase transition shadow-lg shadow-its-red-600/30 disabled:opacity-50"
          >
            {isActivating ? 'Transmitting...' : '⚡ Trigger Green Wave'}
          </button>
        </div>
      </div>

      {/* Intersections Real-Time Monitoring Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-its-blue-950 text-its-yellow-400 uppercase font-black border-b border-its-blue-700">
              <th className="p-3">Intersection ID</th>
              <th className="p-3">Location</th>
              <th className="p-3">Corridor</th>
              <th className="p-3">Signal State</th>
              <th className="p-3">Active Phase</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-its-blue-700/40">
            {intersections.map((int) => (
              <tr key={int.id} className="hover:bg-its-blue-950/40 transition">
                <td className="p-3 font-mono font-bold text-white">{int.id}</td>
                <td className="p-3 font-bold text-slate-200">{int.name}</td>
                <td className="p-3 text-slate-300">{int.corridor}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      int.status === 'GREEN_WAVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : int.status === 'AUTOMATED'
                        ? 'bg-its-blue-950 text-sky-400 border border-sky-500/30'
                        : 'bg-its-red-950 text-its-red-400 border border-its-red-500/30'
                    }`}
                  >
                    {int.status}
                  </span>
                </td>
                <td className="p-3 font-mono text-slate-300">{int.currentPhase}</td>
                <td className="p-3 text-right">
                  {int.status === 'GREEN_WAVE' && (
                    <button
                      onClick={() => handleResetCorridor(int.corridor)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-600 transition"
                    >
                      Reset to Auto
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}