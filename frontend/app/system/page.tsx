'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { getSystemHealth } from '../lib/api';
import { Activity, Database, Server, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SystemHealthPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemHealth().then((res) => {
      setSystemHealth(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="System Component Health"
          subtitle="Real-time operational latency & health checks for core system components"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Overall Health Summary */}
          <div className="fintech-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Overall System Status: HEALTHY</h3>
                <p className="text-xs text-slate-500">
                  Last checked: {systemHealth?.checked_at ? new Date(systemHealth.checked_at).toLocaleTimeString() : 'Just now'}
                </p>
              </div>
            </div>

            <StatusBadge status={systemHealth?.overall_status || 'HEALTHY'} size="md" />
          </div>

          {/* Component Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemHealth?.components?.map((comp: any, idx: number) => (
              <div key={idx} className="fintech-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-bold text-slate-900">{comp.name}</h4>
                  <StatusBadge status={comp.status} size="sm" />
                </div>

                <p className="text-xs text-slate-600 font-medium">{comp.message}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Latency:</span>
                  <span className="font-mono font-bold text-emerald-600">{comp.latency_ms} ms</span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
