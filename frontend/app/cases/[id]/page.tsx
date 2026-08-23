'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import { getCaseDetails, getCaseTimeline, AuditEventItem } from '../../lib/api';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileCode,
  Sparkles,
} from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = (params?.id as string) || 'case_rf_9901';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [cRes, tRes] = await Promise.all([
        getCaseDetails(caseId),
        getCaseTimeline(caseId),
      ]);
      setCaseData(cRes.data);
      setTimeline(tRes.data);
      setLoading(false);
    }
    loadData();
  }, [caseId]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title={`Case Detail: ${caseId}`}
          subtitle="Consolidated payment recovery state & engineering timeline"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Back Navigation & Case Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Cases
            </Link>

            <div className="flex items-center gap-3">
              <StatusBadge status={caseData?.state || 'ACTIVE'} size="md" />
              <button className="btn btn-primary btn-sm">
                <PlayCircle className="w-3.5 h-3.5" /> Execute Approved Recovery
              </button>
            </div>
          </div>

          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Payment Info */}
            <div className="fintech-card p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <CreditCard className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Payment Information</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{caseData?.payment_id || 'pay_rzp_1001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900">${caseData?.payment?.amount || '1,250.00'} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider:</span>
                  <span className="font-semibold text-slate-800">Razorpay (TEST)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Failure Reason:</span>
                  <span className="font-mono font-semibold text-rose-600">{caseData?.payment?.failure_code || 'BANK_TIMEOUT'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Customer Info */}
            <div className="fintech-card p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Customer Profile</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{caseData?.customer_id || 'cust_acme_01'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Segment:</span>
                  <span className="font-semibold text-slate-800">Enterprise SaaS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Historical Lifetime Value:</span>
                  <span className="font-bold text-slate-900">$45,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recovery Risk Score:</span>
                  <span className="font-semibold text-emerald-600">Low (High LTV)</span>
                </div>
              </div>
            </div>

            {/* Card 3: Deterministic Policy Status */}
            <div className="fintech-card p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Policy Evaluation</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">AI Recommendation:</span>
                  <span className="font-semibold text-purple-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-500" /> RETRY_IMMEDIATE
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deterministic Policy:</span>
                  <span className="font-bold text-emerald-600">APPROVED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attempts Made:</span>
                  <span className="font-bold text-slate-900">{caseData?.attempt_count || 1} / 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authority Safeguard:</span>
                  <span className="font-semibold text-slate-700">AI Financial Execution: 0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Audit Timeline */}
          <div className="fintech-card p-6 bg-white space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Engineering Audit Timeline</h3>
                <p className="text-xs text-slate-500">
                  Chronological event execution history with correlation tracking and structured metadata.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                {timeline.length} Audit Events Logged
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((event, idx) => (
                <div key={event.event_id || idx} className="relative group">
                  {/* Timeline Dot Icon */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-sky-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                  </div>

                  {/* Event Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{event.event_type}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                          {event.correlation_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{event.timestamp ? new Date(event.timestamp).toUTCString() : 'Just now'}</span>
                      </div>
                    </div>

                    {/* Metadata Json Block */}
                    {event.details && (
                      <div className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                        <pre>{JSON.stringify(event.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
