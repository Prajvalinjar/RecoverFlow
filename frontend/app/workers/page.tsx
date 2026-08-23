'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getOperationsWorkers, WorkerItem } from '../lib/api';
import { Server, Activity, Cpu, HardDrive, ShieldAlert, Power } from 'lucide-react';

export default function WorkersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkers() {
      setLoading(true);
      const res = await getOperationsWorkers();
      setWorkers(res.data);
      setLoading(false);
    }
    loadWorkers();
  }, []);

  const handleDrainClick = (id: string) => {
    setSelectedWorkerId(id);
    setDialogOpen(true);
  };

  const handleConfirmDrain = () => {
    setWorkers(prev =>
      prev.map(w => (w.worker_id === selectedWorkerId ? { ...w, status: 'DRAINING' } : w))
    );
    setDialogOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Worker Queue Nodes"
          subtitle="Distributed recovery worker registry & heartbeat monitoring"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Top Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="fintech-card p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Active Worker Nodes</span>
                <div className="text-2xl font-bold brand-font text-slate-900 mt-1">{workers.length} Nodes</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Server className="w-5 h-5" />
              </div>
            </div>

            <div className="fintech-card p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Queue Heartbeat</span>
                <div className="text-2xl font-bold brand-font text-emerald-600 mt-1">Healthy</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="fintech-card p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Worker Protocol</span>
                <div className="text-2xl font-bold brand-font text-sky-600 mt-1">v1.0.0</div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Worker Node Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workers.map((w) => (
              <div key={w.worker_id} className="fintech-card p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="font-bold text-base text-slate-900">{w.worker_id}</div>
                    <div className="text-xs font-mono text-slate-500">{w.hostname}</div>
                  </div>
                  <StatusBadge status={w.status} size="md" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Process ID:</span>
                    <span className="font-mono font-semibold text-slate-800">{w.process_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Heartbeat:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(w.last_heartbeat_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Node Capabilities:</span>
                    <span className="font-bold text-sky-600">{w.capabilities.length} Capabilities</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Lease Auto-renew</span>
                  {w.status !== 'DRAINING' && (
                    <button
                      onClick={() => handleDrainClick(w.worker_id)}
                      className="btn btn-secondary btn-sm text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <Power className="w-3 h-3" /> Drain Worker
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        <ConfirmDialog
          isOpen={dialogOpen}
          title={`Mark Worker ${selectedWorkerId} as DRAINING?`}
          description="Worker will complete current claimed recovery jobs but will stop claiming new jobs from the queue."
          confirmLabel="Drain Worker"
          variant="warning"
          onConfirm={handleConfirmDrain}
          onCancel={() => setDialogOpen(false)}
        />
      </div>
    </div>
  );
}
