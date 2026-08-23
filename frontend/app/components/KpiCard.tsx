import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  change,
  trend = 'up',
  icon: Icon,
  iconBgColor = 'bg-sky-50',
  iconColor = 'text-sky-600',
}) => {
  return (
    <div className="fintech-card p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-xl ${iconBgColor} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-bold brand-font text-slate-900 tracking-tight">{value}</div>
        
        {(change || subtext) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {change && (
              <span
                className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
                  trend === 'up'
                    ? 'bg-emerald-50 text-emerald-700'
                    : trend === 'down'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-600" />}
                {change}
              </span>
            )}
            {subtext && <span className="text-slate-500 font-medium">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
