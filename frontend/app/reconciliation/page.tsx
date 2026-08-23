'use client';

import React from 'react';
import { PageShell } from '../components/PageShell';
import { StatusBadge } from '../components/StatusBadge';
import { GitMerge, ShieldAlert, RefreshCw } from 'lucide-react';

export default function ReconciliationPage() {
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
    <PageShell
      title="Reconciliation Queue"
      subtitle="Provider execution reconciliation & UNKNOWN state safety management"
    >
      <div className="space-y-4">
        {/* Critical Invariant Banner */}
        <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-start gap-3 text-[12px] text-purple-950">
          <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">UNKNOWN Provider State Safety Invariant</div>
            <div className="text-purple-700 mt-0.5">
              When a payment provider returns UNKNOWN or TIMEOUT, RecoverFlow routes the case to <strong>MANUAL REVIEW REQUIRED</strong>. UNKNOWN status NEVER automatically becomes RECOVERED.
            </div>
          </div>
        </div>

        {/* Reconciliation Queue Table */}
        <div className="rf-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-cyan-600" />
              <h3 className="text-[14px] font-semibold text-slate-900">Reconciliation Records</h3>
            </div>
            <button className="rf-btn rf-btn-secondary rf-btn-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Run Reconciliation Scan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Payment ID</th>
                  <th>Provider</th>
                  <th>Provider Status</th>
                  <th>Outcome Status</th>
                  <th>Reconciliation Status</th>
                  <th className="text-right">Recovered Amount</th>
                  <th className="text-right">Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                {reconItems.map((r) => (
                  <tr key={r.case_id}>
                    <td className="font-mono font-semibold text-[12px] text-slate-900">{r.case_id}</td>
                    <td className="font-mono text-[11px] text-slate-500">{r.payment_id}</td>
                    <td className="font-semibold text-slate-700 uppercase text-[11px]">{r.provider}</td>
                    <td className="font-bold text-[12px] text-slate-800">{r.provider_status}</td>
                    <td className="font-semibold text-[12px] text-slate-700">{r.outcome_status}</td>
                    <td>
                      <StatusBadge status={r.reconciliation_status} size="sm" />
                    </td>
                    <td className="text-right font-bold font-tabular text-slate-900">{r.recovered_amount}</td>
                    <td className="text-right text-[12px] text-slate-500">
                      {new Date(r.last_attempt).toLocaleTimeString()}
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
