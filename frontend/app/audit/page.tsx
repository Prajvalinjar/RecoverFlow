'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { getOperationsAudit, AuditEventItem } from '../lib/api';
import { Lock, Search } from 'lucide-react';

export default function AuditPage() {
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
    <PageShell
      title="Immutable Audit Trail"
      subtitle="Append-only PostgreSQL compliance audit log & execution history"
    >
      <div className="space-y-4">
        {/* Search & Immutability Pill */}
        <div className="rf-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Event, Case, Correlation..."
              className="w-full pl-8 pr-3 py-[6px] text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Append-Only Security Audit Log</span>
          </div>
        </div>

        {/* Audit Trail List */}
        <div className="rf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Event Type</th>
                  <th>Case ID</th>
                  <th>Correlation ID</th>
                  <th>Timestamp</th>
                  <th>Structured Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => (
                  <tr key={e.event_id}>
                    <td className="font-mono font-semibold text-[12px] text-slate-900">{e.event_id}</td>
                    <td>
                      <span className="font-mono font-bold text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {e.event_type}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-slate-700">{e.case_id}</td>
                    <td className="font-mono text-[11px] text-slate-400">{e.correlation_id}</td>
                    <td className="text-[12px] text-slate-500">
                      {new Date(e.timestamp).toUTCString()}
                    </td>
                    <td>
                      <div className="p-1.5 rounded bg-slate-900 text-slate-200 font-mono text-[10px] max-w-xs overflow-x-auto truncate">
                        {JSON.stringify(e.details)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
