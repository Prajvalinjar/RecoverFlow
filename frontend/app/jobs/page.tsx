'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '../components/PageShell';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getOperationsJobs, retryJob, JobItem } from '../lib/api';
import { RefreshCw, AlertOctagon, RotateCcw, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

export default function JobsPage() {
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
    <PageShell
      title="Recovery Jobs & Queue"
      subtitle="Durable recovery job queue infrastructure & lease monitoring"
    >
      <div className="space-y-4">
        {/* Top Queue Depth KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rf-card p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Queued Jobs</div>
              <div className="text-[22px] font-bold brand-font font-tabular text-slate-900 mt-1">{statusCounts.QUEUED}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="rf-card p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Running</div>
              <div className="text-[22px] font-bold brand-font font-tabular text-cyan-600 mt-1">{statusCounts.RUNNING}</div>
            </div>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="rf-card p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Succeeded</div>
              <div className="text-[22px] font-bold brand-font font-tabular text-emerald-600 mt-1">{statusCounts.SUCCEEDED}</div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="rf-card p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dead-Letter Queue</div>
              <div className="text-[22px] font-bold brand-font font-tabular text-rose-600 mt-1">{statusCounts.DEAD_LETTER}</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rf-card p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-[6px] text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 font-semibold text-slate-700"
            >
              <option value="">All Job Statuses</option>
              <option value="QUEUED">QUEUED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="SUCCEEDED">SUCCEEDED</option>
              <option value="FAILED">FAILED</option>
              <option value="DEAD_LETTER">DEAD LETTER</option>
            </select>
          </div>

          <button className="rf-btn rf-btn-secondary rf-btn-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Recover Expired Leases
          </button>
        </div>

        {/* Jobs Table */}
        <div className="rf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Job Type</th>
                  <th>Case ID</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Attempt #</th>
                  <th>Worker Node</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.job_id}>
                    <td className="font-mono font-semibold text-[12px] text-slate-900">{j.job_id}</td>
                    <td className="font-mono text-[11px] text-slate-600">{j.job_type}</td>
                    <td className="font-mono text-[11px] text-slate-500">{j.case_id}</td>
                    <td>
                      <StatusBadge status={j.status} size="sm" />
                    </td>
                    <td className="font-bold text-[12px] text-slate-800">{j.priority}</td>
                    <td className="font-medium text-[12px] text-slate-700 font-tabular">
                      {j.attempt_number} / {j.max_attempts}
                    </td>
                    <td className="font-mono text-[11px] text-slate-500">{j.worker || '—'}</td>
                    <td className="text-right">
                      {j.status === 'DEAD_LETTER' || j.status === 'FAILED' ? (
                        <button
                          onClick={() => handleTriggerRetry(j.job_id)}
                          className="rf-btn rf-btn-primary rf-btn-xs"
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
    </PageShell>
  );
}
