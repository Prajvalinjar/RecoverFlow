'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageShell } from '../components/PageShell';
import { StatusBadge } from '../components/StatusBadge';
import { getRecoveryCases, CaseItem } from '../lib/api';
import { Search, X, ArrowUpRight } from 'lucide-react';

export default function RecoveryCasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [failureFilter, setFailureFilter] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'amount'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getRecoveryCases();
      setCases(res.data);
      setFilteredCases(res.data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = [...cases];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.case_id.toLowerCase().includes(q) || c.customer_name.toLowerCase().includes(q) || c.payment_id.toLowerCase().includes(q));
    }
    if (statusFilter) result = result.filter(c => c.state === statusFilter);
    if (failureFilter) result = result.filter(c => c.failure_reason === failureFilter);
    result.sort((a, b) => {
      if (sortField === 'amount') return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      return sortOrder === 'desc' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    setFilteredCases(result);
  }, [search, statusFilter, failureFilter, sortField, sortOrder, cases]);

  const selectClass = "px-3 py-[6px] text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-medium text-slate-600 appearance-none cursor-pointer";

  return (
    <PageShell title="Recovery Cases" subtitle="Payment recovery case management & state inspection">
      <div className="space-y-4">
        {/* Filter */}
        <div className="rf-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search case, customer, payment..."
                className="w-full pl-8 pr-3 py-[6px] text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 placeholder:text-slate-400" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option><option value="RECOVERED">Recovered</option>
              <option value="FAILED">Failed</option><option value="ESCALATED">Escalated</option>
              <option value="STOPPED">Stopped</option><option value="MANUAL_REVIEW">Manual Review</option>
            </select>
            <select value={failureFilter} onChange={e => setFailureFilter(e.target.value)} className={`${selectClass} hidden lg:block`}>
              <option value="">All Failures</option>
              <option value="BANK_TIMEOUT">Bank Timeout</option><option value="NETWORK_FAILURE">Network Failure</option>
              <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option><option value="CARD_DECLINED">Card Declined</option>
              <option value="AUTHENTICATION_FAILURE">Auth Failure</option>
            </select>
            {(search || statusFilter || failureFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setFailureFilter(''); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[12px] text-slate-400 shrink-0">
            <strong className="text-slate-700">{filteredCases.length}</strong> cases
          </span>
        </div>

        {/* Table */}
        <div className="rf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Case ID</th><th>Payment</th><th>Customer</th>
                  <th className="text-right cursor-pointer hover:text-slate-600"
                    onClick={() => { setSortField('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Amount {sortField === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th>Failure</th><th>Status</th><th>Attempts</th>
                  <th className="cursor-pointer hover:text-slate-600"
                    onClick={() => { setSortField('created_at'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Created {sortField === 'created_at' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map(c => (
                  <tr key={c.case_id}>
                    <td className="font-mono font-semibold text-[12px] text-slate-800">{c.case_id}</td>
                    <td className="font-mono text-[11px] text-slate-500">{c.payment_id}</td>
                    <td className="text-[12px] text-slate-700">{c.customer_name}</td>
                    <td className="text-right font-semibold font-tabular text-slate-900">${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td><span className="font-mono text-[11px] text-slate-500">{c.failure_reason}</span></td>
                    <td><StatusBadge status={c.state} size="sm" /></td>
                    <td className="font-tabular text-slate-600">{c.attempt_count}/3</td>
                    <td className="text-[12px] text-slate-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="text-right">
                      <Link href={`/cases/${c.case_id}`} className="rf-btn rf-btn-secondary rf-btn-xs">
                        View <ArrowUpRight className="w-3 h-3" />
                      </Link>
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
