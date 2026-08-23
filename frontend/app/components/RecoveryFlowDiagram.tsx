'use client';

import React from 'react';
import { AlertCircle, Eye, BrainCircuit, ShieldCheck, PlayCircle, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    num: '01', title: 'PAYMENT FAILURE', sub: 'Webhook Ingestion',
    desc: 'HMAC-verified idempotent event capture',
    icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA',
  },
  {
    num: '02', title: 'DETECT & PARSE', sub: 'Case Created',
    desc: 'Normalized error classification',
    icon: Eye, color: '#0EA5E9', bg: '#E0F2FE', border: '#BAE6FD',
  },
  {
    num: '03', title: 'ANALYZE', sub: 'AI Recommendation',
    desc: 'Recovery confidence scoring',
    icon: BrainCircuit, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE',
    badge: 'ADVISORY ONLY',
  },
  {
    num: '04', title: 'POLICY EVAL', sub: 'Deterministic Policy',
    desc: 'Hard limits, attempt caps, merchant rules',
    icon: ShieldCheck, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0',
    badge: 'EXECUTION AUTHORITY',
    emphasis: true,
  },
  {
    num: '05', title: 'EXECUTE', sub: 'Recovery Orchestrator',
    desc: 'Circuit-breaker-protected provider dispatch',
    icon: PlayCircle, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE',
  },
  {
    num: '06', title: 'RECONCILE', sub: 'Verification Engine',
    desc: 'UNKNOWN → Manual Review routing',
    icon: CheckCircle2, color: '#14B8A6', bg: '#F0FDFA', border: '#99F6E4',
  },
];

export const RecoveryFlowDiagram: React.FC = () => {
  return (
    <div className="rf-card-static p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">RecoverFlow Autonomous Recovery Engine</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">
            From payment failure to verified reconciliation with deterministic policy boundaries.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AI Execution Authority: 0%</span>
        </div>
      </div>

      {/* Flow Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div
              key={idx}
              className={`relative p-4 rounded-xl border transition-all hover:shadow-md group ${
                step.emphasis ? 'ring-2 ring-emerald-200 border-emerald-300' : ''
              }`}
              style={{ borderColor: step.emphasis ? undefined : step.border, background: '#fff' }}
            >
              {/* Step number + icon row */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black tracking-widest text-slate-300">{step.num}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: step.bg }}>
                  <StepIcon className="w-4 h-4" style={{ color: step.color }} />
                </div>
              </div>

              {/* Content */}
              <h4 className="text-[12px] font-bold text-slate-900 leading-tight mb-0.5">{step.title}</h4>
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">{step.sub}</div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{step.desc}</p>

              {/* Badge */}
              {step.badge && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <span className={`inline-block px-2 py-[2px] rounded text-[9px] font-extrabold tracking-wide uppercase ${
                    step.badge.includes('AUTHORITY')
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-purple-100 text-purple-800 border border-purple-300'
                  }`}>
                    {step.badge}
                  </span>
                </div>
              )}

              {/* Connector arrow (hidden on last + mobile) */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-[10px] top-1/2 -translate-y-1/2 z-10">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 8H12M12 8L9 5M12 8L9 11" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
