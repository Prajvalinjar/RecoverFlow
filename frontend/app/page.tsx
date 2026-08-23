'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './components/Logo';
import {
  ShieldCheck, ArrowRight, CheckCircle2, Lock, Server,
  Activity, BarChart3, Eye, BrainCircuit, PlayCircle,
  GitMerge, AlertCircle,
} from 'lucide-react';

const metrics = [
  { label: 'Revenue At Risk', value: '$245,680.50', color: '#EF4444' },
  { label: 'Revenue Recovered', value: '$182,450.00', color: '#10B981' },
  { label: 'Recovery Rate', value: '74.26%', color: '#0EA5E9' },
  { label: 'Execution Success', value: '98.5%', color: '#F59E0B' },
];

const flowSteps = [
  { num: '01', title: 'Payment Failure', desc: 'Webhook ingestion with HMAC verification', icon: AlertCircle, color: '#EF4444' },
  { num: '02', title: 'Detect & Parse', desc: 'Normalized error classification', icon: Eye, color: '#0EA5E9' },
  { num: '03', title: 'Analyze', desc: 'AI-powered recovery scoring', icon: BrainCircuit, color: '#8B5CF6' },
  { num: '04', title: 'Policy Decision', desc: 'Deterministic authority evaluation', icon: ShieldCheck, color: '#10B981' },
  { num: '05', title: 'Execute', desc: 'Circuit-breaker-protected dispatch', icon: PlayCircle, color: '#3B82F6' },
  { num: '06', title: 'Reconcile', desc: 'Provider state verification', icon: CheckCircle2, color: '#14B8A6' },
];

const capabilities = [
  { title: 'Deterministic Policy Authority', desc: 'AI provides recommendations, but execution is 100% governed by deterministic policy code with strict financial attempt caps.', icon: ShieldCheck, color: '#10B981' },
  { title: 'Multi-Provider Isolation', desc: 'Normalized provider capability registry and error classification. Razorpay remains in TEST/SANDBOX mode by default.', icon: Server, color: '#0EA5E9' },
  { title: 'Immutable Audit Trail', desc: 'Every state change, execution attempt, and policy decision appended to an immutable PostgreSQL audit table.', icon: Lock, color: '#8B5CF6' },
  { title: 'Circuit Breaker Protection', desc: 'Automatic provider isolation during degradation with configurable failure thresholds and recovery windows.', icon: Activity, color: '#F59E0B' },
  { title: 'Revenue Intelligence', desc: 'Real-time analytics on recovery rates, failure patterns, and revenue protection across all payment providers.', icon: BarChart3, color: '#3B82F6' },
  { title: 'Reconciliation Engine', desc: 'UNKNOWN provider states routed to manual review. No automatic marking of unverified transactions as recovered.', icon: GitMerge, color: '#14B8A6' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1F33', color: '#F8FAFC' }}>
      {/* Nav */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 border-b border-white/[0.08]"
              style={{ background: 'rgba(11, 31, 51, 0.95)', backdropFilter: 'blur(12px)' }}>
        <Logo variant="dark" size="md" />
        <Link href="/dashboard" className="rf-btn rf-btn-brand px-5 py-2 text-[13px] rounded-lg">
          Open Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 text-[12px] font-semibold text-cyan-400"
                   style={{ background: 'rgba(14, 165, 233, 0.08)' }}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Autonomous Payment Recovery Platform
              </div>

              <h1 className="text-[40px] sm:text-[52px] lg:text-[60px] font-extrabold brand-font leading-[1.05] tracking-tight" style={{ color: '#FFFFFF' }}>
                <span>Payments Fail.</span>
                <br />
                <span className="text-transparent bg-clip-text" style={{
                  backgroundImage: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 50%, #14B8A6 100%)'
                }}>
                  Revenue Shouldn't.
                </span>
              </h1>

              <p className="text-[16px] leading-relaxed max-w-xl" style={{ color: '#94A3B8' }}>
                RecoverFlow detects payment failures, evaluates recovery opportunities using deterministic policy authority, executes policy-approved recovery actions, and provides complete operational visibility.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/dashboard" className="rf-btn rf-btn-brand px-6 py-3 text-[14px] rounded-xl"
                      style={{ boxShadow: '0 4px 20px -4px rgba(14, 165, 233, 0.35)' }}>
                  Open Operations Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/flow" className="rf-btn text-[14px] px-6 py-3 rounded-xl border border-white/10 hover:bg-white/[0.04]" style={{ color: '#CBD5E1' }}>
                  Explore Recovery Flow
                </Link>
              </div>
            </div>

            {/* Right — Flow visualization */}
            <div className="hidden lg:block">
              <div className="p-6 rounded-2xl border border-white/[0.08]"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="space-y-3">
                  {flowSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]"
                         style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                           style={{ background: `${step.color}18` }}>
                        <step.icon className="w-4 h-4" style={{ color: step.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold tracking-widest" style={{ color: '#64748B' }}>{step.num}</span>
                          <span className="text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>{step.title}</span>
                        </div>
                        <p className="text-[11px]" style={{ color: '#94A3B8' }}>{step.desc}</p>
                      </div>
                      {idx === 2 && (
                        <span className="px-2 py-[2px] text-[9px] font-bold text-purple-300 rounded border border-purple-500/30"
                              style={{ background: 'rgba(139, 92, 246, 0.15)' }}>ADVISORY</span>
                      )}
                      {idx === 3 && (
                        <span className="px-2 py-[2px] text-[9px] font-bold text-emerald-300 rounded border border-emerald-500/30"
                              style={{ background: 'rgba(16, 185, 129, 0.15)' }}>AUTHORITY</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="px-6 lg:px-12 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-white/[0.08]"
               style={{ background: 'rgba(255,255,255,0.03)' }}>
            {metrics.map((m, i) => (
              <div key={i} className={`text-center py-2 ${i > 0 ? 'border-l border-white/[0.08]' : ''}`}>
                <div className="text-[24px] sm:text-[28px] font-bold brand-font font-tabular tracking-tight" style={{ color: m.color }}>
                  {m.value}
                </div>
                <div className="text-[11px] font-medium mt-1 uppercase tracking-wider" style={{ color: '#64748B' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 lg:px-12 border-t border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.18)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[34px] font-bold brand-font" style={{ color: '#FFFFFF' }}>End-to-End Recovery Pipeline</h2>
            <p className="text-[14px] mt-2 max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
              From idempotent event detection to final reconciliation with deterministic policy safety boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {flowSteps.map((step, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-white/[0.08]"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: `${step.color}18` }}>
                    <step.icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>
                  <span className="text-[10px] font-black tracking-widest" style={{ color: '#64748B' }}>{step.num}</span>
                </div>
                <h3 className="text-[15px] font-semibold mb-1" style={{ color: '#FFFFFF' }}>{step.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: '#94A3B8' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security By Design */}
      <section className="py-20 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[34px] font-bold brand-font mb-4" style={{ color: '#FFFFFF' }}>Security By Design</h2>
          <p className="text-[14px] mb-10 max-w-xl mx-auto" style={{ color: '#94A3B8' }}>
            AI intelligence informs recovery decisions. Deterministic policy code controls execution authority.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="p-6 rounded-xl border border-purple-500/25 text-left"
                 style={{ background: 'rgba(139, 92, 246, 0.08)' }}>
              <BrainCircuit className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-[16px] font-bold mb-1" style={{ color: '#FFFFFF' }}>AI Intelligence</h3>
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#CBD5E1' }}>
                Evaluates failure patterns, customer LTV, and recovery probability to recommend optimal actions.
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-purple-500/25"
                   style={{ background: 'rgba(139, 92, 246, 0.12)' }}>
                <div className="text-[28px] font-bold brand-font text-purple-400">0%</div>
                <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Execution Authority</div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-emerald-500/25 text-left"
                 style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />
              <h3 className="text-[16px] font-bold mb-1" style={{ color: '#FFFFFF' }}>Deterministic Policy</h3>
              <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#CBD5E1' }}>
                Strict rules enforce attempt caps, delay constraints, and merchant rules before approving execution.
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-500/25"
                   style={{ background: 'rgba(16, 185, 129, 0.12)' }}>
                <div className="text-[28px] font-bold brand-font text-emerald-400">100%</div>
                <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Execution Authority</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 px-6 lg:px-12 border-t border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.18)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] sm:text-[34px] font-bold brand-font" style={{ color: '#FFFFFF' }}>Operations Command Center</h2>
            <p className="text-[14px] mt-2" style={{ color: '#94A3B8' }}>Everything you need to monitor and control payment recovery operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-white/[0.08] hover:border-white/[0.15] transition-colors"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                     style={{ background: `${cap.color}18` }}>
                  <cap.icon className="w-5 h-5" style={{ color: cap.color }} />
                </div>
                <h3 className="text-[14px] font-semibold mb-1" style={{ color: '#FFFFFF' }}>{cap.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: '#94A3B8' }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[32px] font-bold brand-font mb-3" style={{ color: '#FFFFFF' }}>Start Recovering Revenue</h2>
          <p className="text-[15px] mb-8" style={{ color: '#94A3B8' }}>Access the operations dashboard to monitor and control your payment recovery infrastructure.</p>
          <Link href="/dashboard" className="rf-btn rf-btn-brand px-8 py-3.5 text-[15px] rounded-xl inline-flex"
                style={{ boxShadow: '0 4px 20px -4px rgba(14, 165, 233, 0.35)' }}>
            Open Operations Dashboard <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 border-t border-white/[0.06] text-center">
        <p className="text-[12px]" style={{ color: '#64748B' }}>© 2026 RecoverFlow Inc. Intelligent Payment Recovery Operations Platform.</p>
      </footer>
    </div>
  );
}
