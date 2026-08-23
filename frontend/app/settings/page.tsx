'use client';

import React from 'react';
import { PageShell } from '../components/PageShell';
import { Lock, ShieldCheck, Server } from 'lucide-react';

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings & Configuration"
      subtitle="Provider configuration status, security boundaries & operational RBAC"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Configuration Status */}
        <div className="rf-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-600" />
              <h3 className="text-[14px] font-bold text-slate-900">Razorpay Provider Configuration</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              CONFIGURED
            </span>
          </div>

          <div className="space-y-3 text-[12px]">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Environment:</span>
              <div className="font-bold text-slate-900 mt-0.5">test (SANDBOX)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Razorpay Key ID:</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">rzp_test_key123****</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Secret Safety Audit:</span>
              <div className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> secrets_exposed: false
              </div>
            </div>
          </div>
        </div>

        {/* Security & Webhook Auth Settings */}
        <div className="rf-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-[14px] font-bold text-slate-900">Security & Webhook Protection</h3>
            </div>
          </div>

          <div className="space-y-3 text-[12px]">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">HMAC Webhook Signature Verification:</span>
              <div className="font-bold text-emerald-600 mt-0.5">ENABLED (SHA-256)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Replay Protection Tolerance:</span>
              <div className="font-bold text-slate-900 mt-0.5">300 Seconds (5 Minutes)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Rate Limiting Thresholds:</span>
              <div className="font-bold text-slate-900 mt-0.5">Webhooks: 100/min | Operations: 60/min</div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
