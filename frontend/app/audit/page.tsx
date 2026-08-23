'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { getOperationsAudit, AuditEventItem } from '../lib/api';
import { FileText, Lock, Search, Filter, Clock } from 'lucide-react';

export default function AuditPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEventItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      const res = await getOperationsAudit();
      setEvents(res.data);
      setFilteredEvents(res.data);
      setLoading(false);
    }
    loadAudit();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredEvents(events);
      return;
    }
    const q = search.toLowerCase();
    setFilteredEvents(
      events.filter(
        (e) =>
          e.event_type.toLowerCase().includes(q) ||
          e.case_id.toLowerCase().includes(q) ||
          e.correlation_id.toLowerCase().includes(q)
      )
    );
  }, [search, events]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Immutable Audit Trail"
          subtitle="Append-only PostgreSQL compliance audit log & execution history"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Immutability Banner */}
          <div className="fintech-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Event Type, Case ID, Correlation..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Immutable Append-Only Security Audit Log</span>
            </div>
          </div>

          {/* Audit Trail List */}
          <div className="fintech-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Event ID</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Correlation ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Structured Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((e) => (
                    <tr key={e.event_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{e.event_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {e.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{e.case_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{e.correlation_id}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(e.timestamp).toUTCString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="p-2 rounded bg-slate-900 text-slate-200 font-mono text-[10px] max-w-xs overflow-x-auto truncate">
                          {JSON.stringify(e.details)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
