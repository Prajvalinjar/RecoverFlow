'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { StatusBadge } from '../components/StatusBadge';
import { getPayments, PaymentItem } from '../lib/api';
import { Search, Lock } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      const res = await getPayments();
      setPayments(res.data);
      setFilteredPayments(res.data);
      setLoading(false);
    }
    loadPayments();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPayments(payments);
      return;
    }
    const q = search.toLowerCase();
    setFilteredPayments(
      payments.filter(
        (p) =>
          p.payment_id.toLowerCase().includes(q) ||
          p.customer_id.toLowerCase().includes(q) ||
          p.failure_code.toLowerCase().includes(q)
      )
    );
  }, [search, payments]);

  return (
    <PageShell
      title="Payments Log"
      subtitle="Ingested payment failure transactions & provider operational status"
    >
      <div className="space-y-4">
        {/* Search and security bar */}
        <div className="rf-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Payment ID, Customer..."
              className="w-full pl-8 pr-3 py-[6px] text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Credential Leakage Protection Active</span>
          </div>
        </div>

        {/* Payments Table */}
        <div className="rf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Customer ID</th>
                  <th className="text-right">Amount</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Failure Code</th>
                  <th className="text-right">Created Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.payment_id}>
                    <td className="font-mono font-semibold text-[12px] text-slate-900">{p.payment_id}</td>
                    <td className="font-mono text-[11px] text-slate-600">{p.customer_id}</td>
                    <td className="text-right font-bold font-tabular text-slate-900">
                      ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {p.currency}
                    </td>
                    <td className="font-semibold text-slate-700 uppercase text-[11px]">
                      {p.provider} (TEST)
                    </td>
                    <td>
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="font-mono text-[11px] text-rose-600 font-semibold">
                      {p.failure_code}
                    </td>
                    <td className="text-right text-[12px] text-slate-500">
                      {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
