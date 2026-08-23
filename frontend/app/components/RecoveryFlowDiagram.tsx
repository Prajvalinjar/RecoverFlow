import React from 'react';
import { AlertCircle, Eye, BrainCircuit, ShieldCheck, PlayCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const RecoveryFlowDiagram: React.FC = () => {
  const steps = [
    {
      title: 'PAYMENT FAILURE',
      subtitle: 'Webhook Ingested',
      desc: 'Idempotent ingestion via HMAC & replay check',
      icon: AlertCircle,
      color: 'border-rose-200 bg-rose-50/70 text-rose-700',
      iconColor: 'text-rose-600',
    },
    {
      title: 'DETECT & PARSE',
      subtitle: 'Case Created',
      desc: 'Normalized error category classified',
      icon: Eye,
      color: 'border-sky-200 bg-sky-50/70 text-sky-700',
      iconColor: 'text-sky-600',
    },
    {
      title: 'ANALYZE',
      subtitle: 'AI Recommendation',
      desc: 'Confidence score & reasoning (ADVISORY ONLY)',
      icon: BrainCircuit,
      color: 'border-purple-200 bg-purple-50/70 text-purple-700',
      iconColor: 'text-purple-600',
      badge: 'ADVISORY ONLY',
    },
    {
      title: 'POLICY EVALUATION',
      subtitle: 'Deterministic Policy',
      desc: 'Hard limits, attempt caps & merchant rules',
      icon: ShieldCheck,
      color: 'border-emerald-200 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/30',
      iconColor: 'text-emerald-600',
      badge: 'DETERMINISTIC AUTHORITY',
    },
    {
      title: 'RECOVER & EXECUTE',
      subtitle: 'Recovery Orchestrator',
      desc: 'Dispatched to provider with circuit breaker',
      icon: PlayCircle,
      color: 'border-blue-200 bg-blue-50/70 text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      title: 'VERIFY & RECONCILE',
      subtitle: 'Reconciliation Engine',
      desc: 'UNKNOWN status routed to Manual Review',
      icon: CheckCircle2,
      color: 'border-teal-200 bg-teal-50/70 text-teal-700',
      iconColor: 'text-teal-600',
    },
  ];

  return (
    <div className="fintech-card p-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">RecoverFlow Autonomous Recovery Flow</h3>
          <p className="text-xs text-slate-500">
            End-to-end payment recovery execution pipeline with deterministic policy safety boundaries.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>AI Execution Authority: 0% (Advisory Only)</span>
        </div>
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div key={idx} className="relative flex flex-col justify-between p-4 rounded-xl border transition-all hover:shadow-md bg-white">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400">0{idx + 1}</span>
                  <div className={`p-2 rounded-lg ${step.color}`}>
                    <StepIcon className={`w-4 h-4 ${step.iconColor}`} />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{step.title}</h4>
                <div className="text-[11px] font-semibold text-slate-600 mb-2">{step.subtitle}</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{step.desc}</p>
              </div>

              {step.badge && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase ${
                      step.badge.includes('AUTHORITY')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}
                  >
                    {step.badge}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
