'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { RecoveryFlowDiagram } from '../components/RecoveryFlowDiagram';
import { ShieldCheck, BrainCircuit, PlayCircle, GitMerge, Lock, CheckCircle2 } from 'lucide-react';

export default function FlowPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Recovery Flow Visualization"
          subtitle="Autonomous payment recovery architecture & deterministic policy safety boundaries"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          <RecoveryFlowDiagram />

          {/* Deep Architectural Isolation Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="fintech-card p-6 space-y-3">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 w-fit">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. AI Recommendation Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates failure code history, customer LTV, and historical recovery probabilities to propose candidate recovery actions.
              </p>
              <div className="pt-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  ADVISORY ONLY (0% EXECUTION AUTHORITY)
                </span>
              </div>
            </div>

            <div className="fintech-card p-6 space-y-3 border-2 border-emerald-500/30 bg-emerald-50/20">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. Deterministic Policy Authority</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict deterministic policy rules enforce max allowed attempt caps (3 attempts max), delay constraints, and merchant rules before approving execution.
              </p>
              <div className="pt-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  DETERMINISTIC FINANCIAL AUTHORITY
                </span>
              </div>
            </div>

            <div className="fintech-card p-6 space-y-3">
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600 w-fit">
                <PlayCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Recovery Orchestrator & Provider</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executes policy-approved recovery actions through normalized provider abstractions with circuit breaker safety and idempotency keys.
              </p>
              <div className="pt-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  IDEMPOTENT EXECUTION DISPATCHER
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
