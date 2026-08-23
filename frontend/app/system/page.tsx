'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { StatusBadge } from '../components/StatusBadge';
import { getSystemHealth } from '../lib/api';
import { CheckCircle2 } from 'lucide-react';

export default function SystemHealthPage() {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemHealth().then((res) => {
      setSystemHealth(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <PageShell
      title="System Component Health"
      subtitle="Real-time operational latency & health checks for core system components"
    >
      <div className="space-y-6">
        {/* Overall Health Summary */}
        <div className="rf-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-slate-900">Overall System Status: HEALTHY</h3>
              <p className="text-[12px] text-slate-400">
                Last checked: {systemHealth?.checked_at ? new Date(systemHealth.checked_at).toLocaleTimeString() : 'Just now'}
              </p>
            </div>
          </div>

          <StatusBadge status={systemHealth?.overall_status || 'HEALTHY'} size="md" />
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {systemHealth?.components?.map((comp: any, idx: number) => (
            <div key={idx} className="rf-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-[13px] font-bold text-slate-900">{comp.name}</h4>
                <StatusBadge status={comp.status} size="sm" />
              </div>

              <p className="text-[12px] text-slate-600 font-medium">{comp.message}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Latency:</span>
                <span className="font-mono font-bold text-emerald-600">{comp.latency_ms} ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
