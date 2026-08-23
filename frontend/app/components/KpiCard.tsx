import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  accentColor?: string;
  sparkData?: number[];
}

const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const h = 28;
  const w = 64;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, subtext, change, trend = 'up', icon: Icon,
  accentColor = '#0EA5E9',
  sparkData = [30, 42, 38, 52, 48, 60, 55],
}) => {
  return (
    <div className="rf-card p-4 flex flex-col justify-between relative overflow-hidden">
      {/* Accent top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accentColor }} />

      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className="p-1.5 rounded-lg" style={{ background: `${accentColor}10` }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[22px] font-bold brand-font text-slate-900 leading-none font-tabular tracking-tight">
            {value}
          </div>
          {(change || subtext) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {change && (
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-[1px] rounded ${
                  trend === 'up' ? 'bg-emerald-50 text-emerald-700' :
                  trend === 'down' ? 'bg-rose-50 text-rose-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  {change}
                </span>
              )}
              {subtext && <span className="text-[11px] text-slate-400">{subtext}</span>}
            </div>
          )}
        </div>
        <MiniSparkline data={sparkData} color={accentColor} />
      </div>
    </div>
  );
};
