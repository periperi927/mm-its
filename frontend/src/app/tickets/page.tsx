'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import TicketTable from '@/components/dashboard/TicketTable';
import { api } from '@/lib/api';

interface Ticket {
  id: string;
  ticket_number: string;
  driver_name: string;
  license_number: string;
  plate_number: string;
  violation_type: string;
  fine_amount: number;
  status: 'UNPAID' | 'PAID' | 'DISPUTED' | 'CANCELLED';
  issued_at: string;
}

export default function SingleTicketingPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sample/Initial Ticket Dataset
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      ticket_number: 'STS-2026-00891',
      driver_name: 'Juan Dela Cruz',
      license_number: 'N01-12-345678',
      plate_number: 'ABC-1234',
      violation_type: 'Reckless Driving',
      fine_amount: 2000,
      status: 'UNPAID',
      issued_at: '2026-09-24 09:30 AM',
    },
    {
      id: '2',
      ticket_number: 'STS-2026-00892',
      driver_name: 'Maria Santos',
      license_number: 'N02-98-765432',
      plate_number: 'XYZ-9876',
      violation_type: 'Disregarding Traffic Sign',
      fine_amount: 1000,
      status: 'PAID',
      issued_at: '2026-09-24 08:15 AM',
    },
    {
      id: '3',
      ticket_number: 'STS-2026-00893',
      driver_name: 'Antonio Luna',
      license_number: 'N03-45-678901',
      plate_number: 'NCG-5432',
      violation_type: 'Obstruction of Yellow Box',
      fine_amount: 1500,
      status: 'DISPUTED',
      issued_at: '2026-09-23 04:45 PM',
    },
  ]);

  // Form State for Ticket Creation
  const [newTicket, setNewTicket] = useState({
    license_number: '',
    plate_number: '',
    violation_type: 'Reckless Driving',
    fine_amount: 2000,
  });

  // Fetch Tickets from FastAPI on Component Mount
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tickets');
      if (Array.isArray(response.data) && response.data.length > 0) {
        setTickets(response.data);
      }
    } catch (err) {
      console.warn('Backend /tickets endpoint unavailable, keeping initial dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered Tickets Calculation
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = filterStatus === 'ALL' || ticket.status === filterStatus;
    const matchesQuery =
      ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send POST request to FastAPI endpoint
      const res = await api.post('/tickets', newTicket);
      setTickets([res.data, ...tickets]);
    } catch (err) {
      // Fallback local append for demo/offline workflow
      const mockCreated: Ticket = {
        id: String(Date.now()),
        ticket_number: `STS-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        driver_name: 'Verified Driver (LTO)',
        license_number: newTicket.license_number,
        plate_number: newTicket.plate_number,
        violation_type: newTicket.violation_type,
        fine_amount: Number(newTicket.fine_amount),
        status: 'UNPAID',
        issued_at: new Date().toLocaleString(),
      };
      setTickets([mockCreated, ...tickets]);
    } finally {
      setShowCreateModal(false);
      setNewTicket({
        license_number: '',
        plate_number: '',
        violation_type: 'Reckless Driving',
        fine_amount: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-its-blue-950 text-white flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Header Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-its-yellow-500/20 pb-4">
            <div>
              <h1 className="text-2xl font-black text-its-yellow-400 tracking-tight flex items-center gap-2">
                <span>Single Ticketing System (STS)</span>
                <span className="text-xs bg-its-yellow-500 text-its-blue-950 font-bold px-2.5 py-0.5 rounded-full">
                  MMDA / LTO Unified
                </span>
              </h1>
              <p className="text-xs text-slate-300 font-semibold mt-1">
                Manage traffic violation records, LTO demerit tracking, and online citation payments
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-its-yellow-500 hover:bg-its-yellow-400 text-its-blue-950 font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-lg shadow-its-yellow-500/20 uppercase tracking-wider"
            >
              + Issue Citation Ticket
            </button>
          </div>

          {/* Top Row: LTO Verification Tool & Quick Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TicketTable />
            </div>

            {/* Quick Summary Card */}
            <div className="bg-its-blue-900 border-2 border-its-yellow-500/40 p-6 rounded-xl shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-its-yellow-400 border-b border-its-blue-700/50 pb-2">
                Enforcement Summary
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-its-blue-950 p-3 rounded-lg border border-its-blue-700/50">
                  <span className="text-slate-300 font-semibold">Total Citations Issued</span>
                  <span className="text-base font-black text-white">{tickets.length}</span>
                </div>
                <div className="flex justify-between items-center bg-its-blue-950 p-3 rounded-lg border border-its-blue-700/50">
                  <span className="text-slate-300 font-semibold">Unpaid Citations</span>
                  <span className="text-base font-black text-its-red-500">
                    {tickets.filter((t) => t.status === 'UNPAID').length}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-its-blue-950 p-3 rounded-lg border border-its-blue-700/50">
                  <span className="text-slate-300 font-semibold">Active Disputes</span>
                  <span className="text-base font-black text-its-yellow-400">
                    {tickets.filter((t) => t.status === 'DISPUTED').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Citation Search & Filtered Table */}
          <div className="bg-its-blue-900 border-2 border-its-yellow-500/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-its-blue-700/50 pb-4">
              <h2 className="text-lg font-extrabold text-its-yellow-400">
                Violation Records Registry
              </h2>

              {/* Filters & Search Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search Ticket, Driver, License, or Plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-its-blue-950 border border-its-blue-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-its-yellow-400 w-64"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-its-blue-950 border border-its-blue-700 rounded-lg px-3 py-1.5 text-xs text-its-yellow-400 font-bold focus:outline-none focus:ring-2 focus:ring-its-yellow-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID">Paid</option>
                  <option value="DISPUTED">Disputed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  onClick={fetchTickets}
                  className="bg-its-blue-950 hover:bg-its-blue-800 border border-its-blue-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg transition"
                  title="Reload Records from Backend"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-its-blue-950 text-its-yellow-400 uppercase font-extrabold border-b border-its-blue-700/60">
                    <th className="p-3">Ticket No.</th>
                    <th className="p-3">Driver / License</th>
                    <th className="p-3">Plate No.</th>
                    <th className="p-3">Violation</th>
                    <th className="p-3">Fine (PHP)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Issued At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-its-blue-700/40">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                        Loading citation records from command center...
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 font-semibold">
                        No violation records match your current search/filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-its-blue-950/50 transition">
                        <td className="p-3 font-mono font-bold text-white">{ticket.ticket_number}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-200">{ticket.driver_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{ticket.license_number}</p>
                        </td>
                        <td className="p-3 font-bold text-its-yellow-400 font-mono">{ticket.plate_number}</td>
                        <td className="p-3 text-slate-200">{ticket.violation_type}</td>
                        <td className="p-3 font-bold text-white">₱{ticket.fine_amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              ticket.status === 'PAID'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                : ticket.status === 'UNPAID'
                                ? 'bg-its-red-600 text-white'
                                : ticket.status === 'DISPUTED'
                                ? 'bg-its-yellow-500 text-its-blue-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{ticket.issued_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Citation Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-its-blue-900 border-2 border-its-yellow-500/50 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-its-yellow-400 border-b border-its-blue-700/50 pb-2">
              Issue Traffic Citation
            </h3>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Driver License Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. N01-12-345678"
                  value={newTicket.license_number}
                  onChange={(e) => setNewTicket({ ...newTicket, license_number: e.target.value })}
                  className="w-full bg-its-blue-950 border border-its-blue-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-its-yellow-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Vehicle Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC-1234"
                  value={newTicket.plate_number}
                  onChange={(e) => setNewTicket({ ...newTicket, plate_number: e.target.value })}
                  className="w-full bg-its-blue-950 border border-its-blue-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-its-yellow-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Violation Category</label>
                <select
                  value={newTicket.violation_type}
                  onChange={(e) => {
                    const selectedViolation = e.target.value;
                    let fine = 2000;
                    if (selectedViolation === 'Disregarding Traffic Sign') fine = 1000;
                    if (selectedViolation === 'Obstruction of Yellow Box') fine = 1500;
                    if (selectedViolation === 'Illegal Parking') fine = 1000;
                    setNewTicket({
                      ...newTicket,
                      violation_type: selectedViolation,
                      fine_amount: fine,
                    });
                  }}
                  className="w-full bg-its-blue-950 border border-its-blue-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-its-yellow-400 font-bold"
                >
                  <option value="Reckless Driving">Reckless Driving (₱2,000)</option>
                  <option value="Disregarding Traffic Sign">Disregarding Traffic Sign (₱1,000)</option>
                  <option value="Obstruction of Yellow Box">Obstruction of Yellow Box (₱1,500)</option>
                  <option value="Illegal Parking">Illegal Parking (₱1,000)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-its-red-600 hover:bg-its-red-500 text-white font-bold py-2 rounded-lg transition shadow-lg shadow-its-red-600/30"
                >
                  Issue Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}