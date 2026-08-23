'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '../../components/PageShell';
import { StatusBadge } from '../../components/StatusBadge';
import { getCaseDetails, getCaseTimeline, AuditEventItem } from '../../lib/api';
import { ArrowLeft, ShieldCheck, CreditCard, User, Clock, PlayCircle, Sparkles } from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = (params?.id as string) || 'case_rf_9901';
  const [caseData, setCaseData] = useState<any>(null);
  const [timeline, setTimeline] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [cRes, tRes] = await Promise.all([getCaseDetails(caseId), getCaseTimeline(caseId)]);
      setCaseData(cRes.data);
      setTimeline(tRes.data);
      setLoading(false);
    }
    load();
  }, [caseId]);

  const InfoRow = ({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) => (
    <div className="flex justify-between py-1.5">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className={`text-[12px] font-semibold ${mono ? 'font-mono' : ''} ${color || 'text-slate-800'}`}>{value}</span>
    </div>
  );

  return (
    <PageShell title={`Case: ${caseId}`} subtitle="Recovery case investigation & audit timeline"
      actions={
        <Link href="/cases" className="rf-btn rf-btn-ghost rf-btn-sm"><ArrowLeft className="w-3.5 h-3.5" /> Cases</Link>
      }>
      <div className="space-y-6">
        {/* Header strip */}
        <div className="rf-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusBadge status={caseData?.state || 'ACTIVE'} />
            <div>
              <div className="text-[14px] font-bold text-slate-900 font-mono">{caseId}</div>
              <div className="text-[11px] text-slate-400">Created {caseData?.created_at ? new Date(caseData.created_at).toLocaleString() : 'Recently'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-bold brand-font text-slate-900 font-tabular">
              ${caseData?.payment?.amount || '1,250.00'}
            </span>
            <span className="text-[11px] text-slate-400 uppercase font-medium">{caseData?.payment?.currency || 'USD'}</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Payment */}
          <div className="rf-card p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              <h3 className="text-[13px] font-semibold text-slate-900">Payment Details</h3>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow label="Payment ID" value={caseData?.payment_id || 'pay_rzp_1001'} mono />
              <InfoRow label="Amount" value={`$${caseData?.payment?.amount || '1,250.00'}`} />
              <InfoRow label="Provider" value="Razorpay (TEST)" />
              <InfoRow label="Failure" value={caseData?.payment?.failure_code || 'BANK_TIMEOUT'} mono color="text-rose-600" />
            </div>
          </div>

          {/* Customer */}
          <div className="rf-card p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-purple-600" />
              <h3 className="text-[13px] font-semibold text-slate-900">Customer Profile</h3>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow label="Customer ID" value={caseData?.customer_id || 'cust_acme_01'} mono />
              <InfoRow label="Segment" value="Enterprise SaaS" />
              <InfoRow label="Lifetime Value" value="$45,000.00" />
              <InfoRow label="Risk Score" value="Low (High LTV)" color="text-emerald-600" />
            </div>
          </div>

          {/* Policy */}
          <div className="rf-card p-5 border-emerald-200" style={{ borderColor: '#A7F3D0' }}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-[13px] font-semibold text-slate-900">Policy Evaluation</h3>
            </div>
            <div className="divide-y divide-slate-50">
              <InfoRow label="AI Recommendation" value="RETRY_IMMEDIATE" color="text-purple-600" />
              <InfoRow label="Policy Decision" value="APPROVED" color="text-emerald-600" />
              <InfoRow label="Attempts" value={`${caseData?.attempt_count || 1} / 3`} />
              <InfoRow label="AI Exec Authority" value="0%" color="text-slate-500" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rf-card-static p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-[14px] font-semibold text-slate-900">Recovery Timeline</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Chronological event history with correlation tracking</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-semibold">
              {timeline.length} events
            </span>
          </div>

          <div className="relative pl-6 space-y-4">
            <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-slate-200" />
            {timeline.map((event, idx) => (
              <div key={event.event_id || idx} className="relative">
                <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-white border-2 border-cyan-400 flex items-center justify-center">
                  <div className="w-[6px] h-[6px] rounded-full bg-cyan-500" />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold font-mono text-slate-800">{event.event_type}</span>
                      <span className="px-1.5 py-[1px] rounded text-[9px] font-mono bg-slate-100 text-slate-500">{event.correlation_id}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                  {event.details && (
                    <div className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto">
                      <pre>{JSON.stringify(event.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
