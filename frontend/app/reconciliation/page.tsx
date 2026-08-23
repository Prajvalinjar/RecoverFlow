'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { GitMerge, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ReconciliationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const reconItems = [
    {
      case_id: 'case_rf_9901',
      payment_id: 'pay_rzp_1001',
      provider: 'razorpay',
      provider_status: 'COMPLETED',
      outcome_status: 'RECOVERED',
      reconciliation_status: 'RECONCILED',
      recovered_amount: '$1,250.00',
      last_attempt: '2026-08-23T11:32:16Z',
    },
    {
      case_id: 'case_rf_9905',
      payment_id: 'pay_rzp_1005',
      provider: 'razorpay',
      provider_status: 'UNKNOWN',
      outcome_status: 'PENDING',
      reconciliation_status: 'MANUAL_REVIEW',
      recovered_amount: '$0.00',
      last_attempt: '2026-08-23T09:45:00Z',
    },
    {
      case_id: 'case_rf_9902',
      payment_id: 'pay_rzp_1002',
      provider: 'razorpay',
      provider_status: 'PROCESSING',
      outcome_status: 'PENDING',
      reconciliation_status: 'IN_PROGRESS',
      recovered_amount: '$0.00',
      last_attempt: '2026-08-23T11:28:40Z',
    },
  ];

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Reconciliation Queue"
          subtitle="Provider execution reconciliation & UNKNOWN state safety management"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Critical Invariant Banner */}
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-3 text-xs text-purple-900">
            <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">UNKNOWN Provider State Safety Invariant</div>
              <div className="text-purple-700 mt-0.5">
                When a payment provider returns UNKNOWN or TIMEOUT, RecoverFlow routes the case to <strong>MANUAL REVIEW REQUIRED</strong>. UNKNOWN status NEVER automatically becomes RECOVERED.
              </div>
            </div>
          </div>

          {/* Reconciliation Queue Table */}
          <div className="fintech-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Reconciliation Records</h3>
              </div>
              <button className="btn btn-secondary btn-sm text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Run Reconciliation Scan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Provider Status</th>
                    <th className="py-3 px-4">Outcome Status</th>
                    <th className="py-3 px-4">Reconciliation Status</th>
                    <th className="py-3 px-4">Recovered Amount</th>
                    <th className="py-3 px-4">Last Attempt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconItems.map((r) => (
                    <tr key={r.case_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{r.case_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{r.payment_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700 uppercase">{r.provider}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{r.provider_status}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{r.outcome_status}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.reconciliation_status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.recovered_amount}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(r.last_attempt).toLocaleTimeString()}
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
