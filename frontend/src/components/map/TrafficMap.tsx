'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Signal {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'OVERRIDE';
  congestion: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function TrafficMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const center: [number, number] = [14.5869, 121.0566];

  const signals: Signal[] = [
    { id: 'SIG_01', name: 'EDSA - Ortigas Ave', lat: 14.5869, lng: 121.0566, status: 'GREEN', congestion: 'MEDIUM' },
    { id: 'SIG_02', name: 'EDSA - Shaw Blvd', lat: 14.5812, lng: 121.0535, status: 'RED', congestion: 'HIGH' },
    { id: 'SIG_03', name: 'EDSA - Pioneer St', lat: 14.5732, lng: 121.0488, status: 'OVERRIDE', congestion: 'LOW' },
    { id: 'SIG_04', name: 'Ortigas - C5 Flyover', lat: 14.5885, lng: 121.0721, status: 'YELLOW', congestion: 'MEDIUM' },
  ];

  const greenWaveCorridor: [number, number][] = [
    [14.5869, 121.0566],
    [14.5812, 121.0535],
    [14.5732, 121.0488],
  ];

  const createCustomIcon = (status: Signal['status']) => {
    let color = '#facc15';
    if (status === 'GREEN') color = '#22c55e';
    if (status === 'RED') color = '#dc2626';
    if (status === 'OVERRIDE') color = '#3b82f6';

    const svgHtml = `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 3px solid #0b192c;
        box-shadow: 0 0 12px ${color};
      "></div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: 'custom-traffic-signal-marker',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 1. Initialize Map Instance
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 14,
      scrollWheelZoom: true,
    });

    // 2. Add Dark Theme Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

    // 3. Add Green Wave Polyline Overlay
    L.polyline(greenWaveCorridor, {
      color: '#dc2626',
      weight: 6,
      opacity: 0.85,
      dashArray: '10, 10',
    }).addTo(map);

    // 4. Add Signal Markers & Popups
    signals.forEach((signal) => {
      const statusColor =
        signal.status === 'GREEN'
          ? 'text-emerald-400'
          : signal.status === 'RED'
          ? 'text-its-red-500'
          : signal.status === 'YELLOW'
          ? 'text-its-yellow-400'
          : 'text-blue-400';

      const popupContent = `
        <div className="p-2 bg-its-blue-900 text-white rounded-md border border-its-yellow-500/40 text-xs">
          <p className="font-bold text-its-yellow-400 text-sm mb-1">${signal.name}</p>
          <p><strong className="text-slate-300">ID:</strong> ${signal.id}</p>
          <p>
            <strong className="text-slate-300">Current Phase:</strong> 
            <span className="font-black ${statusColor}">${signal.status}</span>
          </p>
          <p>
            <strong className="text-slate-300">Congestion:</strong> 
            <span className="font-semibold text-slate-200">${signal.congestion}</span>
          </p>
        </div>
      `;

      L.marker([signal.lat, signal.lng], {
        icon: createCustomIcon(signal.status),
      })
        .bindPopup(popupContent, { className: 'custom-leaflet-popup' })
        .addTo(map);
    });

    mapInstanceRef.current = map;
    setIsLoaded(true);

    // Cleanup: Properly unmount the map instance on component tear-down
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-its-yellow-500/40 shadow-2xl relative bg-its-blue-950">
      {/* Telemetry Status Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-its-blue-900/90 backdrop-blur-md p-3 rounded-lg border border-its-yellow-500/40 text-xs text-white space-y-2 shadow-xl">
        <p className="font-bold text-its-yellow-400 uppercase tracking-wider text-[10px]">
          Signal Telemetry Status
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-semibold">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span>Normal (Green)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-its-yellow-400 shadow-sm shadow-its-yellow-400/50"></span>
            <span>Caution (Yellow)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-its-red-600 shadow-sm shadow-its-red-600/50"></span>
            <span>Stop (Red)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
            <span>Green Wave</span>
          </span>
        </div>
      </div>

      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}