import React from 'react';

export type StatusType =
  | 'ACTIVE'
  | 'RECOVERED'
  | 'FAILED'
  | 'ESCALATED'
  | 'STOPPED'
  | 'MANUAL_REVIEW'
  | 'QUEUED'
  | 'CLAIMED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'RETRY_SCHEDULED'
  | 'DEAD_LETTER'
  | 'CANCELLED'
  | 'CLOSED'
  | 'OPEN'
  | 'HALF_OPEN'
  | 'AVAILABLE'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'HEALTHY'
  | 'UNHEALTHY'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const upper = String(status || '').toUpperCase();

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';

  if (['RECOVERED', 'SUCCEEDED', 'CLOSED', 'AVAILABLE', 'HEALTHY'].includes(upper)) {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotClass = 'bg-emerald-500';
  } else if (['ACTIVE', 'RUNNING', 'CLAIMED', 'PROCESSING'].includes(upper)) {
    bgClass = 'bg-sky-50 text-sky-700 border-sky-200';
    dotClass = 'bg-sky-500 animate-pulse';
  } else if (['QUEUED', 'RETRY_SCHEDULED', 'HALF_OPEN', 'PENDING', 'IDLE'].includes(upper)) {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
    dotClass = 'bg-amber-500';
  } else if (['FAILED', 'DEAD_LETTER', 'OPEN', 'UNAVAILABLE', 'UNHEALTHY', 'EXPIRED'].includes(upper)) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    dotClass = 'bg-rose-500';
  } else if (['ESCALATED', 'MANUAL_REVIEW', 'DEGRADED'].includes(upper)) {
    bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
    dotClass = 'bg-purple-500';
  } else if (['STOPPED', 'CANCELLED', 'DRAINING', 'DISABLED'].includes(upper)) {
    bgClass = 'bg-slate-100 text-slate-600 border-slate-300';
    dotClass = 'bg-slate-400';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${paddingClass} ${bgClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {upper.replace('_', ' ')}
    </span>
  );
};
