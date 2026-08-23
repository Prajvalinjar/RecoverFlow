'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getOperationsJobs, retryJob, JobItem } from '../lib/api';
import { Layers, RefreshCw, AlertOctagon, RotateCcw, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

export default function JobsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Confirm Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      const res = await getOperationsJobs(statusFilter || undefined);
      setJobs(res.data);
      setLoading(false);
    }
    loadJobs();
  }, [statusFilter]);

  const handleTriggerRetry = (jobId: string) => {
    setSelectedJobId(jobId);
    setDialogOpen(true);
  };

  const handleConfirmRetry = async () => {
    if (!selectedJobId) return;
    setActionLoading(true);
    await retryJob(selectedJobId);
    setActionLoading(false);
    setDialogOpen(false);
    // Reload
    const res = await getOperationsJobs(statusFilter || undefined);
    setJobs(res.data);
  };

  const statusCounts = {
    QUEUED: jobs.filter(j => j.status === 'QUEUED').length,
    RUNNING: jobs.filter(j => j.status === 'RUNNING').length,
    SUCCEEDED: jobs.filter(j => j.status === 'SUCCEEDED').length,
    DEAD_LETTER: jobs.filter(j => j.status === 'DEAD_LETTER').length,
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Recovery Jobs & Queue"
          subtitle="Durable recovery job queue infrastructure & lease monitoring"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Top Queue Depth KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fintech-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Queued Jobs</div>
                <div className="text-2xl font-bold brand-font text-slate-900 mt-1">{statusCounts.QUEUED}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="fintech-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Active Running</div>
                <div className="text-2xl font-bold brand-font text-sky-600 mt-1">{statusCounts.RUNNING}</div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                <PlayCircle className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="fintech-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Succeeded</div>
                <div className="text-2xl font-bold brand-font text-emerald-600 mt-1">{statusCounts.SUCCEEDED}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="fintech-card p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Dead-Letter Queue</div>
                <div className="text-2xl font-bold brand-font text-rose-600 mt-1">{statusCounts.DEAD_LETTER}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="fintech-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-semibold"
              >
                <option value="">All Job Statuses</option>
                <option value="QUEUED">QUEUED</option>
                <option value="RUNNING">RUNNING</option>
                <option value="SUCCEEDED">SUCCEEDED</option>
                <option value="FAILED">FAILED</option>
                <option value="DEAD_LETTER">DEAD LETTER</option>
              </select>
            </div>

            <button className="btn btn-secondary btn-sm">
              <RotateCcw className="w-3.5 h-3.5" /> Recover Expired Leases
            </button>
          </div>

          {/* Jobs Table */}
          <div className="fintech-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">Job Type</th>
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Attempt #</th>
                    <th className="py-3 px-4">Worker Node</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j) => (
                    <tr key={j.job_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{j.job_id}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">{j.job_type}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{j.case_id}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={j.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{j.priority}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {j.attempt_number} / {j.max_attempts}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{j.worker || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        {j.status === 'DEAD_LETTER' || j.status === 'FAILED' ? (
                          <button
                            onClick={() => handleTriggerRetry(j.job_id)}
                            className="btn btn-primary btn-sm text-[11px]"
                          >
                            <RefreshCw className="w-3 h-3" /> Retry Job
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title={`Retry Job ${selectedJobId}?`}
        description="Re-enqueues this recovery job for processing by active worker nodes under deterministic policy bounds."
        confirmLabel="Confirm Retry"
        loading={actionLoading}
        onConfirm={handleConfirmRetry}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  );
}
