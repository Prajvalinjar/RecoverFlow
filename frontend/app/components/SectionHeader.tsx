import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, badge, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
    <div className="flex items-center gap-2.5">
      <div>
        <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {badge}
    </div>
    {action}
  </div>
);
