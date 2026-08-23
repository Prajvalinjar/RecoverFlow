'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getRecoveryStatus, pauseRecovery, resumeRecovery } from '../lib/api';
import { Sliders, PauseCircle, PlayCircle, ShieldCheck, RefreshCw, Layers, Server } from 'lucide-react';

export default function OperationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recoveryRunning, setRecoveryRunning] = useState(true);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'pause' | 'resume' | null>(null);

  useEffect(() => {
    getRecoveryStatus().then((res) => setRecoveryRunning(res.status === 'RUNNING'));
  }, []);

  const handleActionClick = (action: 'pause' | 'resume') => {
    setPendingAction(action);
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    if (pendingAction === 'pause') {
      await pauseRecovery();
      setRecoveryRunning(false);
    } else if (pendingAction === 'resume') {
      await resumeRecovery();
      setRecoveryRunning(true);
    }
    setLoading(false);
    setDialogOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Operations Control Center"
          subtitle="Master operational status management & system execution switches"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Master System Status Switch Banner */}
          <div className="fintech-card p-6 border-2 border-sky-500/20 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900">Recovery System Execution Status</h3>
                <StatusBadge status={recoveryRunning ? 'RUNNING' : 'STOPPED'} size="md" />
              </div>
              <p className="text-xs text-slate-500">
                Master operational pause/resume switch for new recovery job claims and execution.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {recoveryRunning ? (
                <button
                  onClick={() => handleActionClick('pause')}
                  className="btn btn-danger px-5 py-2.5 text-xs rounded-xl shadow-md"
                >
                  <PauseCircle className="w-4 h-4" /> Pause Recovery Processing
                </button>
              ) : (
                <button
                  onClick={() => handleActionClick('resume')}
                  className="btn btn-brand px-5 py-2.5 text-xs rounded-xl shadow-md"
                >
                  <PlayCircle className="w-4 h-4" /> Resume Recovery Processing
                </button>
              )}
            </div>
          </div>

          {/* Operational Status Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="fintech-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Provider Circuit</h4>
                </div>
                <StatusBadge status="CLOSED" size="sm" />
              </div>
              <p className="text-xs text-slate-500">Razorpay provider circuit breaker is CLOSED and healthy.</p>
            </div>

            <div className="fintech-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Worker Queue</h4>
                </div>
                <StatusBadge status="HEALTHY" size="sm" />
              </div>
              <p className="text-xs text-slate-500">3 worker nodes active with automatic lease recovery.</p>
            </div>

            <div className="fintech-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase">RBAC Role</h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ADMIN PERMISSIONS
                </span>
              </div>
              <p className="text-xs text-slate-500">Operational REST API actions authenticated via X-Operations-Role.</p>
            </div>
          </div>
        </main>

        <ConfirmDialog
          isOpen={dialogOpen}
          title={pendingAction === 'pause' ? 'Pause Payment Recovery Operations?' : 'Resume Payment Recovery Operations?'}
          description={
            pendingAction === 'pause'
              ? 'Pausing prevents worker nodes from claiming new recovery jobs. Existing completed executions will not be altered.'
              : 'Resuming enables worker nodes to resume claiming queued recovery jobs under deterministic policy.'
          }
          confirmLabel={pendingAction === 'pause' ? 'Pause Recovery' : 'Resume Recovery'}
          variant={pendingAction === 'pause' ? 'danger' : 'primary'}
          loading={loading}
          onConfirm={handleConfirmAction}
          onCancel={() => setDialogOpen(false)}
        />
      </div>
    </div>
  );
}
