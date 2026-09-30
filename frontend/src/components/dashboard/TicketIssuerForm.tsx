'use client';

import React, { useState } from 'react';

interface ViolationOption {
  code: string;
  label: string;
  fineAmount: number;
  demeritPoints: number;
}

const COMMON_VIOLATIONS: ViolationOption[] = [
  { code: 'MMDA_OVR_01', label: 'Disregarding Traffic Sign / Signal Light', fineAmount: 1000, demeritPoints: 3 },
  { code: 'MMDA_OVR_02', label: 'Illegal Parking (Attended)', fineAmount: 1000, demeritPoints: 1 },
  { code: 'MMDA_OVR_03', label: 'Illegal Parking (Unattended)', fineAmount: 2000, demeritPoints: 2 },
  { code: 'MMDA_OVR_04', label: 'BUSWAY / Exclusive Lane Encroachment', fineAmount: 5000, demeritPoints: 5 },
  { code: 'MMDA_OVR_05', label: 'Reckless Driving (1st Offense)', fineAmount: 2000, demeritPoints: 3 },
  { code: 'MMDA_OVR_06', label: 'Obstruction of Traffic Flow', fineAmount: 1000, demeritPoints: 1 },
];

export default function TicketIssuerForm() {
  const [plateNumber, setPlateNumber] = useState('');
  const [isSearchingLTO, setIsSearchingLTO] = useState(false);
  const [driverDetails, setDriverDetails] = useState<{
    ownerName: string;
    licenseNo: string;
    makeModel: string;
    color: string;
    status: string;
  } | null>(null);

  const [selectedViolationCode, setSelectedViolationCode] = useState(COMMON_VIOLATIONS[0].code);
  const [location, setLocation] = useState('EDSA NB - Ortigas Flyover Junction');
  const [enforcerId, setEnforcerId] = useState('ENF-2026-8891');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedTicketId, setIssuedTicketId] = useState<string | null>(null);

  const selectedViolation = COMMON_VIOLATIONS.find((v) => v.code === selectedViolationCode) || COMMON_VIOLATIONS[0];

  // Simulated LTO Registry Database Query
  const handleLTOLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;

    setIsSearchingLTO(true);
    setDriverDetails(null);

    setTimeout(() => {
      setIsSearchingLTO(false);
      setDriverDetails({
        ownerName: 'JUAN DELA CRUZ',
        licenseNo: 'N01-18-998123',
        makeModel: 'Toyota Vios 1.5 G (2022)',
        color: 'Silver Metallic',
        status: 'Active / Registered',
      });
    }, 800);
  };

  // Simulated STS Direct Transmission to LTO
  const handleIssueCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const generatedTicket = `STS-LTO-${Math.floor(100000 + Math.random() * 900000)}`;
      setIssuedTicketId(generatedTicket);
      setIsSubmitting(false);
    }, 1200);
  };

  const resetForm = () => {
    setPlateNumber('');
    setDriverDetails(null);
    setRemarks('');
    setIssuedTicketId(null);
  };

  return (
    <div className="bg-its-blue-900 border border-its-yellow-500/30 rounded-2xl p-5 text-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-its-yellow-500/20 pb-3 mb-4">
        <div>
          <h2 className="text-lg font-black text-its-yellow-400 tracking-wide uppercase flex items-center gap-2">
            <span>STS Direct Citation Issuer</span>
            <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/40 px-2 py-0.5 rounded font-mono">
              LTO API v2.4
            </span>
          </h2>
          <p className="text-xs text-slate-300">
            Single Ticketing System — Direct Electronic Violation Transmittal
          </p>
        </div>
      </div>

      {issuedTicketId ? (
        /* Confirmation Card when Citation is Transmitted */
        <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-5 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h3 className="text-lg font-bold text-emerald-300">Citation Transmitted to LTO</h3>
          <p className="text-xs text-slate-300">
            Ticket Reference Number: <span className="font-mono text-its-yellow-400 font-bold">{issuedTicketId}</span>
          </p>
          <div className="bg-its-blue-950/80 p-3 rounded-lg text-left text-xs font-mono space-y-1 text-slate-300 border border-slate-700">
            <p><span className="text-slate-400">Owner:</span> {driverDetails?.ownerName}</p>
            <p><span className="text-slate-400">License:</span> {driverDetails?.licenseNo}</p>
            <p><span className="text-slate-400">Violation:</span> {selectedViolation.label}</p>
            <p><span className="text-slate-400">Total Fine:</span> ₱{selectedViolation.fineAmount.toLocaleString()}</p>
            <p><span className="text-slate-400">Demerit Points:</span> +{selectedViolation.demeritPoints} Points</p>
          </div>
          <button
            onClick={resetForm}
            className="w-full mt-2 bg-its-yellow-500 hover:bg-its-yellow-400 text-its-blue-950 font-extrabold text-sm py-2 px-4 rounded-xl transition"
          >
            Issue Another Citation
          </button>
        </div>
      ) : (
        <form onSubmit={handleIssueCitation} className="space-y-4">
          {/* Step 1: LTO Vehicle License Plate Search */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Vehicle Plate / Conduction Sticker
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="e.g. NBF 8892 or C1 A088"
                className="flex-1 bg-its-blue-950 border border-its-yellow-500/40 rounded-xl px-3 py-2 text-sm font-mono text-its-yellow-400 focus:outline-none focus:border-its-yellow-400 placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={handleLTOLookup}
                disabled={isSearchingLTO || !plateNumber.trim()}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-slate-200 font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                {isSearchingLTO ? 'Querying...' : 'LTO Verify'}
              </button>
            </div>
          </div>

          {/* LTO Query Result Card */}
          {driverDetails && (
            <div className="bg-its-blue-950/90 border border-emerald-500/30 p-3 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400">LTO Verification Verified</span>
                <span className="text-[10px] text-slate-400 font-mono">{driverDetails.status}</span>
              </div>
              <p><span className="text-slate-400">Registered Owner:</span> <strong className="text-slate-100">{driverDetails.ownerName}</strong></p>
              <p><span className="text-slate-400">Driver License:</span> <strong className="text-slate-100">{driverDetails.licenseNo}</strong></p>
              <p><span className="text-slate-400">Vehicle:</span> <strong className="text-slate-100">{driverDetails.makeModel} ({driverDetails.color})</strong></p>
            </div>
          )}

          {/* Step 2: Violation Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Violation Category (STS Standard)
            </label>
            <select
              value={selectedViolationCode}
              onChange={(e) => setSelectedViolationCode(e.target.value)}
              className="w-full bg-its-blue-950 border border-its-yellow-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-its-yellow-400"
            >
              {COMMON_VIOLATIONS.map((v) => (
                <option key={v.code} value={v.code} className="bg-its-blue-950 text-white">
                  [{v.code}] {v.label} — ₱{v.fineAmount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Fine & Demerit Summary Box */}
          <div className="grid grid-cols-2 gap-3 bg-its-blue-950/60 p-2.5 rounded-xl border border-slate-800">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Preset Fine</p>
              <p className="text-sm font-black text-its-yellow-400">₱{selectedViolation.fineAmount.toLocaleString()} PHP</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">LTO Demerit Points</p>
              <p className="text-sm font-black text-rose-400">+{selectedViolation.demeritPoints} Points</p>
            </div>
          </div>

          {/* Step 3: Location & Enforcer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Location / Sector
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-its-blue-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-its-yellow-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Issuing Officer ID
              </label>
              <input
                type="text"
                value={enforcerId}
                onChange={(e) => setEnforcerId(e.target.value)}
                className="w-full bg-its-blue-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-its-yellow-400 font-mono"
                required
              />
            </div>
          </div>

          {/* Step 4: Remarks / AI CCTV Evidence Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              NCAP / CCTV Evidence Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Captured on CAM_EDSA_ORTIGAS_01 at 15:32 PST. Vehicle crossed red signal stop line."
              className="w-full bg-its-blue-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-its-yellow-400 placeholder:text-slate-600"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || !driverDetails}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition shadow-lg shadow-rose-950/40 disabled:opacity-50 disabled:hover:bg-rose-600 uppercase tracking-wider"
          >
            {isSubmitting ? 'Transmitting to LTO API...' : 'Transmit Electronic Citation to LTO'}
          </button>
        </form>
      )}
    </div>
  );
}