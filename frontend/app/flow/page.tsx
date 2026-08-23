'use client';

import React from 'react';
import { PageShell } from '../components/PageShell';
import { RecoveryFlowDiagram } from '../components/RecoveryFlowDiagram';
import { ShieldCheck, BrainCircuit, PlayCircle, Lock, Zap, GitMerge } from 'lucide-react';

export default function FlowPage() {
  return (
    <PageShell title="Recovery Flow" subtitle="Autonomous payment recovery architecture & deterministic policy safety boundaries">
      <div className="space-y-6">
        {/* Main Flow Diagram */}
        <RecoveryFlowDiagram />

        {/* AI Safety Boundary */}
        <div className="rf-card-static p-6">
          <div className="mb-5 pb-4 border-b border-slate-100">
            <h3 className="text-[15px] font-semibold text-slate-900">Recovery Authority Model</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">AI intelligence informs decisions. Deterministic policy controls execution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* AI Layer */}
            <div className="p-5 rounded-xl border border-purple-200 bg-purple-50/30">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                <BrainCircuit className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-[14px] font-semibold text-slate-900 mb-1">AI Recommendation Engine</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
                Evaluates failure code history, customer LTV, and historical recovery probabilities to propose candidate recovery actions.
              </p>
              <div className="p-3 rounded-lg bg-purple-100/60 border border-purple-200">
                <div className="flex items-center gap-2">
                  <span className="text-[24px] font-bold brand-font text-purple-600">0%</span>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Execution Authority</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500"><Zap className="w-3 h-3 text-purple-400" /> Can: Detect, Classify, Recommend</div>
                <div className="flex items-center gap-1.5 text-slate-500"><Lock className="w-3 h-3 text-slate-400" /> Cannot: Execute, Override, Approve</div>
              </div>
            </div>

            {/* Deterministic Policy — Emphasized */}
            <div className="p-5 rounded-xl border-2 border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-[14px] font-semibold text-slate-900 mb-1">Deterministic Policy Authority</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
                Strict deterministic rules enforce max allowed attempt caps (3 max), delay constraints, and merchant rules before approving execution.
              </p>
              <div className="p-3 rounded-lg bg-emerald-100/60 border border-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="text-[24px] font-bold brand-font text-emerald-600">100%</span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Execution Authority</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Controls: All recovery execution</div>
                <div className="flex items-center gap-1.5 text-slate-500"><Lock className="w-3 h-3 text-emerald-400" /> Enforces: Attempt caps, delays, RBAC</div>
              </div>
            </div>

            {/* Execution */}
            <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/30">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mb-3">
                <PlayCircle className="w-5 h-5 text-sky-600" />
              </div>
              <h4 className="text-[14px] font-semibold text-slate-900 mb-1">Recovery Orchestrator</h4>
              <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
                Executes policy-approved recovery actions through normalized provider abstractions with circuit breaker safety.
              </p>
              <div className="p-3 rounded-lg bg-sky-100/60 border border-sky-200">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Idempotent Execution Dispatcher</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500"><GitMerge className="w-3 h-3 text-sky-400" /> Provider: Circuit-breaker-protected</div>
                <div className="flex items-center gap-1.5 text-slate-500"><Lock className="w-3 h-3 text-sky-400" /> Safety: Idempotency key enforcement</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
