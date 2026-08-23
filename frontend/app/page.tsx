'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './components/Logo';
import { RecoveryFlowDiagram } from './components/RecoveryFlowDiagram';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Server,
  Activity,
  BarChart3,
  CreditCard,
  Layers,
  Database,
  Terminal,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md">
        <Logo variant="dark" size="lg" />

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="btn btn-brand px-5 py-2.5 text-sm rounded-xl shadow-lg shadow-sky-500/20"
          >
            <span>Open Operations Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Autonomous Payment Recovery Platform • Phase 2B/2C Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold brand-font tracking-tight text-white leading-tight">
            Payments Fail.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-300">
              Revenue Shouldn't.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            RecoverFlow detects payment failures, evaluates recovery opportunities using deterministic policy authority, executes policy-approved recovery actions, and provides full operational visibility.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="btn btn-brand px-6 py-3 text-base rounded-xl shadow-xl shadow-sky-500/25"
            >
              <span>Open Operations Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/flow"
              className="btn bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-6 py-3 text-base rounded-xl"
            >
              <span>View Recovery Flow</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Bar Preview */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-800/60 border border-slate-800 backdrop-blur-xs">
          <div className="text-center p-3">
            <div className="text-2xl lg:text-3xl font-extrabold brand-font text-white">$245,680.50</div>
            <div className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Revenue At Risk</div>
          </div>
          <div className="text-center p-3 border-l border-slate-700/50">
            <div className="text-2xl lg:text-3xl font-extrabold brand-font text-emerald-400">$182,450.00</div>
            <div className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Revenue Recovered</div>
          </div>
          <div className="text-center p-3 border-l border-slate-700/50">
            <div className="text-2xl lg:text-3xl font-extrabold brand-font text-sky-400">74.26%</div>
            <div className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Recovery Rate</div>
          </div>
          <div className="text-center p-3 border-l border-slate-700/50">
            <div className="text-2xl lg:text-3xl font-extrabold brand-font text-amber-300">98.5%</div>
            <div className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Execution Success</div>
          </div>
        </div>
      </section>

      {/* Process Architecture Flow Section */}
      <section className="py-16 px-6 lg:px-12 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold brand-font text-white">
              End-to-End Recovery Flow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From idempotent event detection to final reconciliation with deterministic policy boundaries.
            </p>
          </div>

          <div className="text-slate-900">
            <RecoveryFlowDiagram />
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Deterministic Policy Authority</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI provides recovery recommendations, but execution is 100% governed by deterministic policy code with strict financial attempt caps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Provider Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Normalized provider capability registry and error classification. Razorpay remains in TEST/SANDBOX mode by default.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Immutable Audit Trail</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every case state change, execution attempt, and policy decision is appended to an immutable append-only PostgreSQL audit table.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 RecoverFlow Inc. Intelligent Payment Recovery Operations Platform.</p>
      </footer>
    </div>
  );
}
