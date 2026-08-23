'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { StatusBadge } from '../components/StatusBadge';
import { getProviderHealth, ProviderHealthItem } from '../lib/api';
import { Server, ShieldCheck, Lock } from 'lucide-react';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderHealthItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProviders() {
      setLoading(true);
      const res = await getProviderHealth();
      setProviders(res.data);
      setLoading(false);
    }
    loadProviders();
  }, []);

  return (
    <PageShell
      title="Payment Provider Health"
      subtitle="Multi-provider lifecycle state machine & circuit breaker monitoring"
    >
      <div className="space-y-6">
        {/* Provider Card & Circuit Breaker Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Razorpay Health */}
          <div className="rf-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900">Razorpay Provider</h3>
                  <span className="text-[11px] font-semibold text-slate-400">TEST / SANDBOX ENVIRONMENT</span>
                </div>
              </div>
              <StatusBadge status="AVAILABLE" size="md" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Circuit Breaker:</span>
                <div className="text-[16px] font-bold text-emerald-600 mt-0.5">CLOSED</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Success Streak:</span>
                <div className="text-[16px] font-bold font-tabular text-slate-900 mt-0.5">148 Executions</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Rate Limit Failures:</span>
                <div className="text-[16px] font-bold font-tabular text-slate-900 mt-0.5">0</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Capabilities:</span>
                <div className="text-[13px] font-bold text-cyan-600 mt-0.5">SEND_PAYMENT_LINK</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero real financial execution authority. TEST/SANDBOX key configured.</span>
            </div>
          </div>

          {/* Circuit Breaker State Diagram */}
          <div className="rf-card p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-[14px] font-bold text-slate-900">Circuit Breaker State Machine</h3>
              <p className="text-[11px] text-slate-400">Deterministic fallback & execution protection layer</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-emerald-50 border-2 border-emerald-500 text-emerald-800">
                <div className="font-bold text-[12px]">CLOSED</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Normal Execution</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
                <div className="font-bold text-[12px]">OPEN</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Requests Blocked</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
                <div className="font-bold text-[12px]">HALF_OPEN</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Probe Quota (1)</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Failure Threshold:</span>
                <span className="font-semibold text-slate-800">3 Consecutive Failures</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recovery Timeout:</span>
                <span className="font-semibold text-slate-800">30.0 Seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Safe Status Output:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> secrets_exposed: false
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
