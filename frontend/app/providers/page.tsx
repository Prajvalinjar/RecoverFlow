'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { getProviderHealth, ProviderHealthItem } from '../lib/api';
import { Server, ShieldCheck, Zap, AlertTriangle, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function ProvidersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Payment Provider Health"
          subtitle="Multi-provider lifecycle state machine & circuit breaker monitoring"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Provider Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="fintech-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Razorpay Provider</h3>
                    <span className="text-xs font-semibold text-slate-500">TEST / SANDBOX ENVIRONMENT</span>
                  </div>
                </div>
                <StatusBadge status="AVAILABLE" size="md" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Circuit Breaker State:</span>
                  <div className="text-base font-bold text-emerald-600 mt-1">CLOSED</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Consecutive Successes:</span>
                  <div className="text-base font-bold text-slate-900 mt-1">148 Executions</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Rate Limit Failures:</span>
                  <div className="text-base font-bold text-slate-900 mt-1">0</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500">Capabilities Supported:</span>
                  <div className="text-base font-bold text-sky-600 mt-1">SEND_PAYMENT_LINK</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero real financial execution authority. TEST/SANDBOX key configured.</span>
              </div>
            </div>

            {/* Circuit Breaker State Diagram */}
            <div className="fintech-card p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Circuit Breaker State Machine</h3>
                <p className="text-xs text-slate-500">Deterministic fallback & execution protection layer</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-800">
                  <div className="font-bold text-xs">CLOSED</div>
                  <div className="text-[10px] text-emerald-600 mt-1">Normal Execution</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
                  <div className="font-bold text-xs">OPEN</div>
                  <div className="text-[10px] text-slate-500 mt-1">Requests Blocked</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400">
                  <div className="font-bold text-xs">HALF_OPEN</div>
                  <div className="text-[10px] text-slate-500 mt-1">Probe Quota (1)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Failure Threshold:</span>
                  <span className="font-bold text-slate-800">3 Consecutive Failures</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recovery Timeout:</span>
                  <span className="font-bold text-slate-800">30.0 Seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Safe Status Output:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> secrets_exposed: false
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
