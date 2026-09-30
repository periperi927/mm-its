'use client';

import React, { useRef, useEffect, useState } from 'react';

export interface BoundingBox {
  id: string;
  label: 'Car' | 'Bus' | 'Jeepney' | 'Motorcycle' | 'Pedestrian' | 'Violation';
  confidence: number;
  x: number; // Percentage (0-100) relative to image width
  y: number; // Percentage (0-100) relative to image height
  width: number;
  height: number;
  licensePlate?: string;
}

interface CCTVStreamProps {
  streamUrl?: string;
  cameraId?: string;
  locationName?: string;
}

export default function CCTVStreamPlayer({
  cameraId = 'CAM_EDSA_ORTIGAS_01',
  locationName = 'EDSA N/B - Ortigas Intersection',
}: CCTVStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showDetections, setShowDetections] = useState<boolean>(true);
  const [showPlates, setShowPlates] = useState<boolean>(true);
  const [activeDetections, setActiveDetections] = useState<BoundingBox[]>([]);

  // Simulated AI Object Detection Telemetry Feed positioned over EDSA road lanes
  useEffect(() => {
    const mockDetections: BoundingBox[] = [
      {
        id: 'det-1',
        label: 'Car',
        confidence: 0.96,
        x: 18,
        y: 62,
        width: 16,
        height: 22,
        licensePlate: 'ABC-1234',
      },
      {
        id: 'det-2',
        label: 'Jeepney',
        confidence: 0.91,
        x: 42,
        y: 58,
        width: 22,
        height: 30,
        licensePlate: 'NXX-8899',
      },
      {
        id: 'det-3',
        label: 'Violation',
        confidence: 0.88,
        x: 68,
        y: 65,
        width: 14,
        height: 20,
        licensePlate: 'MC-44512',
      },
    ];

    setActiveDetections(mockDetections);
  }, []);

  // Sync canvas size dynamically & draw overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas dimensions to match container aspect ratio
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!showDetections) return;

    activeDetections.forEach((box) => {
      const rectX = (box.x / 100) * width;
      const rectY = (box.y / 100) * height;
      const rectW = (box.width / 100) * width;
      const rectH = (box.height / 100) * height;

      // Color scheme based on detection type
      let strokeColor = '#3b82f6'; // Blue default
      let labelBg = '#1e3a8a';

      if (box.label === 'Violation') {
        strokeColor = '#ef4444'; // Red
        labelBg = '#7f1d1d';
      } else if (box.label === 'Jeepney' || box.label === 'Bus') {
        strokeColor = '#eab308'; // Yellow
        labelBg = '#713f12';
      }

      // Draw Bounding Box
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.setLineDash(box.label === 'Violation' ? [6, 3] : []);
      ctx.strokeRect(rectX, rectY, rectW, rectH);

      // Draw Label Badge
      ctx.fillStyle = labelBg;
      const text = `${box.label} ${Math.round(box.confidence * 100)}%`;
      ctx.font = 'bold 11px monospace';
      const textWidth = ctx.measureText(text).width;

      ctx.fillRect(rectX, rectY - 18, textWidth + 10, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, rectX + 5, rectY - 5);

      // Draw License Plate Callout if toggled on
      if (showPlates && box.licensePlate) {
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`[ ${box.licensePlate} ]`, rectX, rectY + rectH + 14);
      }
    });
  }, [activeDetections, showDetections, showPlates]);

  return (
    <div className="bg-its-blue-900 border-2 border-its-yellow-500/30 rounded-xl p-4 shadow-2xl space-y-3">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-its-blue-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div>
            <h3 className="text-sm font-black text-its-yellow-400 tracking-tight">
              LIVE CCTV — {cameraId}
            </h3>
            <p className="text-[10px] text-slate-300 font-semibold">{locationName}</p>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetections(!showDetections)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
              showDetections
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            AI Overlay: {showDetections ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowPlates(!showPlates)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
              showPlates
                ? 'bg-its-yellow-500/20 text-its-yellow-400 border border-its-yellow-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            ALPR Plates
          </button>
        </div>
      </div>

      {/* Video + Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden border border-its-blue-700"
      >
        <img
          src="https://visor.ph/wp-content/uploads/2022/08/edsa-volume-main1.jpg"
          alt="EDSA Traffic Feed"
          className="w-full h-full object-cover rounded-lg"
        />

        {/* AI Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        />

        {/* Live HUD Telemetry Overlay */}
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur border border-white/10 px-2.5 py-1 rounded text-[10px] font-mono text-emerald-400 z-20">
          FPS: 30.0 | YOLOv8 Interoperable | Latency: 42ms
        </div>
      </div>
    </div>
  );
}