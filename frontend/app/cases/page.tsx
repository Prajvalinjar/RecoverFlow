'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { getRecoveryCases, CaseItem } from '../lib/api';
import { Search, Filter, RefreshCw, ArrowUpRight, X, Download } from 'lucide-react';

export default function RecoveryCasesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [failureFilter, setFailureFilter] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'amount'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      const res = await getRecoveryCases();
      setCases(res.data);
      setFilteredCases(res.data);
      setLoading(false);
    }
    loadCases();
  }, []);

  useEffect(() => {
    let result = [...cases];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.case_id.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q) ||
          c.payment_id.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((c) => c.state === statusFilter);
    }

    if (failureFilter) {
      result = result.filter((c) => c.failure_reason === failureFilter);
    }

    result.sort((a, b) => {
      if (sortField === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      return sortOrder === 'desc'
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    setFilteredCases(result);
  }, [search, statusFilter, failureFilter, sortField, sortOrder, cases]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setFailureFilter('');
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Recovery Cases"
          subtitle="Data-heavy payment recovery case management & state inspection"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Filter Bar */}
          <div className="fintech-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Case ID, Customer, Payment..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-medium text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="RECOVERED">RECOVERED</option>
                <option value="FAILED">FAILED</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="STOPPED">STOPPED</option>
                <option value="MANUAL_REVIEW">MANUAL REVIEW</option>
              </select>

              {/* Failure Reason Filter */}
              <select
                value={failureFilter}
                onChange={(e) => setFailureFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-medium text-slate-700 hidden lg:block"
              >
                <option value="">All Failure Reasons</option>
                <option value="BANK_TIMEOUT">BANK TIMEOUT</option>
                <option value="NETWORK_FAILURE">NETWORK FAILURE</option>
                <option value="INSUFFICIENT_FUNDS">INSUFFICIENT FUNDS</option>
                <option value="CARD_DECLINED">CARD DECLINED</option>
                <option value="AUTHENTICATION_FAILURE">AUTH FAILURE</option>
              </select>

              {(search || statusFilter || failureFilter) && (
                <button
                  onClick={clearFilters}
                  className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1 font-semibold"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Showing <strong className="text-slate-900">{filteredCases.length}</strong> cases
              </span>
            </div>
          </div>

          {/* Cases Table */}
          <div className="fintech-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900"
                      onClick={() => {
                        setSortField('amount');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Amount {sortField === 'amount' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-3 px-4">Failure Reason</th>
                    <th className="py-3 px-4">Case Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900"
                      onClick={() => {
                        setSortField('created_at');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Created {sortField === 'created_at' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((c) => (
                    <tr key={c.case_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{c.case_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{c.payment_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{c.customer_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{c.failure_reason}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.state} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {c.attempt_count} / 3
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/cases/${c.case_id}`}
                          className="btn btn-secondary btn-sm text-[11px]"
                        >
                          View Case <ArrowUpRight className="w-3 h-3 text-sky-600" />
                        </Link>
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
