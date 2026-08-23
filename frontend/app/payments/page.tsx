'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { getPayments, PaymentItem } from '../lib/api';
import { Search, CreditCard, Lock, ArrowUpRight } from 'lucide-react';

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Payments Log"
          subtitle="Ingested payment failure transactions & provider operational status"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Header Bar */}
          <div className="fintech-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Payment ID, Customer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Credential Leakage Protection Active</span>
            </div>
          </div>

          {/* Payments Table */}
          <div className="fintech-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Customer ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Failure Code</th>
                    <th className="py-3 px-4">Created Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{p.payment_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.customer_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {p.currency}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 uppercase">
                        {p.provider} (TEST)
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-rose-600 font-semibold">
                        {p.failure_code}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
