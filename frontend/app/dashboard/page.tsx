'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageShell } from '../components/PageShell';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { SectionHeader } from '../components/SectionHeader';
import {
  getOperationsMetrics, getRecoveryCases, getProviderHealth, getOperationsWorkers,
  MetricSummary, CaseItem, ProviderHealthItem, WorkerItem,
} from '../lib/api';
import {
  DollarSign, TrendingUp, RefreshCw, AlertCircle, CheckCircle2, Activity,
  ArrowRight, Server, Layers, ArrowUpRight, BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

export default function OperationsDashboard() {
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [recentCases, setRecentCases] = useState<CaseItem[]>([]);
  const [providers, setProviders] = useState<ProviderHealthItem[]>([]);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [mRes, cRes, pRes, wRes] = await Promise.all([
        getOperationsMetrics(), getRecoveryCases(), getProviderHealth(), getOperationsWorkers(),
      ]);
      setMetrics(mRes.data);
      setRecentCases(cRes.data.slice(0, 6));
      setProviders(pRes.data);
      setWorkers(wRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const performanceData = [
    { day: 'Mon', rate: 68.4, recovered: 24500, at_risk: 32000 },
    { day: 'Tue', rate: 71.2, recovered: 28900, at_risk: 39000 },
    { day: 'Wed', rate: 73.8, recovered: 34100, at_risk: 45000 },
    { day: 'Thu', rate: 72.5, recovered: 31000, at_risk: 42000 },
    { day: 'Fri', rate: 75.6, recovered: 38500, at_risk: 49000 },
    { day: 'Sat', rate: 76.9, recovered: 29000, at_risk: 37000 },
    { day: 'Sun', rate: 78.1, recovered: 32500, at_risk: 41000 },
  ];

  const outcomesData = [
    { name: 'Recovered', value: metrics?.recovered_cases || 890, color: '#10B981' },
    { name: 'Active', value: metrics?.active_cases || 142, color: '#0EA5E9' },
    { name: 'Escalated', value: metrics?.escalated_cases || 74, color: '#8B5CF6' },
    { name: 'Failed', value: metrics?.failed_cases || 86, color: '#EF4444' },
    { name: 'Stopped', value: metrics?.stopped_cases || 48, color: '#94A3B8' },
  ];
  const totalOutcomes = outcomesData.reduce((s, d) => s + d.value, 0);

  const failureData = [
    { reason: 'BANK_TIMEOUT', count: 412, pct: 33 },
    { reason: 'NETWORK_FAIL', count: 285, pct: 23 },
    { reason: 'INSUFFICIENT', count: 230, pct: 18 },
    { reason: 'CARD_DECLINED', count: 195, pct: 16 },
    { reason: 'AUTH_FAIL', count: 118, pct: 10 },
  ];

  const tooltipStyle = { backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' };

  return (
    <PageShell title="Operations Dashboard" subtitle="Real-time payment recovery command center & operational analytics">
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard title="Total Cases" value={metrics?.total_cases?.toLocaleString() || '1,240'}
            change="+14.2%" trend="up" subtext="vs last week" icon={RefreshCw}
            accentColor="#64748B" sparkData={[820, 910, 980, 1050, 1100, 1180, 1240]} />
          <KpiCard title="Active Recoveries" value={metrics?.active_cases?.toLocaleString() || '142'}
            change="+5.1%" trend="up" subtext="processing" icon={Activity}
            accentColor="#0EA5E9" sparkData={[95, 110, 120, 128, 135, 138, 142]} />
          <KpiCard title="Revenue At Risk"
            value={`$${parseFloat(metrics?.revenue_at_risk || '245680.50').toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            change="+8.4%" trend="up" subtext="total" icon={AlertCircle}
            accentColor="#EF4444" sparkData={[180000, 195000, 210000, 225000, 230000, 238000, 245680]} />
          <KpiCard title="Revenue Recovered"
            value={`$${parseFloat(metrics?.revenue_recovered || '182450.00').toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            change="+18.5%" trend="up" subtext="protected" icon={DollarSign}
            accentColor="#10B981" sparkData={[120000, 135000, 148000, 155000, 165000, 174000, 182450]} />
          <KpiCard title="Recovery Rate" value={`${metrics?.recovery_rate_percent || 74.26}%`}
            change="+3.8%" trend="up" subtext="conversion" icon={TrendingUp}
            accentColor="#14B8A6" sparkData={[65, 67, 69, 71, 72, 73, 74.26]} />
          <KpiCard title="Execution Success" value="98.5%"
            change="+0.5%" trend="up" subtext="provider" icon={CheckCircle2}
            accentColor="#8B5CF6" sparkData={[96.5, 97.0, 97.5, 97.8, 98.0, 98.2, 98.5]} />
        </div>

        {/* Analytics Row 1: Performance + Recovery Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="rf-card p-5 lg:col-span-2">
            <SectionHeader title="Recovery Performance" subtitle="Weekly recovery rate trend"
              badge={<span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">+4.2% Avg</span>} />
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} domain={[60, 85]} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(val: any) => [`${val}%`, 'Recovery Rate']} />
                  <Line type="monotone" dataKey="rate" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 3, fill: '#0EA5E9', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut */}
          <div className="rf-card p-5 flex flex-col">
            <SectionHeader title="Recovery Health" subtitle="Case outcome distribution" />
            <div className="flex-1 flex items-center justify-center relative">
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={outcomesData} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {outcomesData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-[22px] font-bold brand-font text-slate-900">{metrics?.recovery_rate_percent || 74.26}%</div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Recovery</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 mt-2 border-t border-slate-100">
              {outcomesData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-500">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 font-tabular">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Row 2: Revenue + Failure Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="rf-card p-5">
            <SectionHeader title="Revenue Recovery" subtitle="Weekly revenue at risk vs recovered" />
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="at_risk" name="At Risk" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recovered" name="Recovered" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Failure Breakdown — horizontal bars */}
          <div className="rf-card p-5">
            <SectionHeader title="Failure Breakdown" subtitle="Top failure codes triggering recovery" />
            <div className="space-y-3 mt-2">
              {failureData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-slate-700 font-mono">{item.reason}</span>
                    <span className="text-[12px] font-semibold text-slate-900 font-tabular">{item.count}</span>
                  </div>
                  <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{ width: `${item.pct}%`, background: idx === 0 ? '#0EA5E9' : idx === 1 ? '#10B981' : idx === 2 ? '#F59E0B' : idx === 3 ? '#8B5CF6' : '#94A3B8' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Cases + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="rf-card lg:col-span-2 overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <SectionHeader title="Recent Recovery Cases" subtitle="Active and recently processed cases" />
              <Link href="/cases" className="text-[12px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 shrink-0">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="rf-table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Customer</th>
                    <th className="text-right">Amount</th>
                    <th>Failure</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((c) => (
                    <tr key={c.case_id}>
                      <td className="font-mono font-semibold text-[12px] text-slate-800">{c.case_id}</td>
                      <td className="text-[12px] text-slate-600">{c.customer_name}</td>
                      <td className="text-right font-semibold font-tabular text-slate-900">${c.amount.toFixed(2)}</td>
                      <td><span className="text-[11px] font-mono text-slate-500">{c.failure_reason}</span></td>
                      <td><StatusBadge status={c.state} size="sm" /></td>
                      <td className="text-right">
                        <Link href={`/cases/${c.case_id}`} className="text-[12px] font-semibold text-cyan-600 hover:text-cyan-700 inline-flex items-center gap-0.5">
                          Details <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operations Health Sidebar */}
          <div className="space-y-4">
            {/* Provider */}
            <div className="rf-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-600" />
                  <h4 className="text-[13px] font-semibold text-slate-900">Provider Health</h4>
                </div>
                <Link href="/providers" className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700">Manage</Link>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-slate-800">Razorpay</span>
                  <StatusBadge status="AVAILABLE" size="sm" />
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-slate-500">Circuit:</span><span className="font-semibold text-emerald-600">CLOSED</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Streak:</span><span className="font-semibold text-slate-700">148 successes</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Mode:</span><span className="font-semibold text-amber-600">TEST</span></div>
                </div>
              </div>
            </div>

            {/* Workers */}
            <div className="rf-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h4 className="text-[13px] font-semibold text-slate-900">Worker Nodes</h4>
                </div>
                <Link href="/workers" className="text-[11px] font-semibold text-purple-600 hover:text-purple-700">Queue</Link>
              </div>
              <div className="space-y-2">
                {workers.map((w) => (
                  <div key={w.worker_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-[12px] font-semibold text-slate-800">{w.worker_id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{w.hostname}</div>
                    </div>
                    <StatusBadge status={w.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rf-card p-4">
              <h4 className="text-[13px] font-semibold text-slate-900 mb-3">Queue Status</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                  <div className="text-[16px] font-bold text-amber-700 font-tabular">4</div>
                  <div className="text-[10px] text-amber-600 font-medium">Queued</div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-center">
                  <div className="text-[16px] font-bold text-cyan-700 font-tabular">2</div>
                  <div className="text-[10px] text-cyan-600 font-medium">Running</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[16px] font-bold text-emerald-700 font-tabular">148</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Succeeded</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-center">
                  <div className="text-[16px] font-bold text-rose-700 font-tabular">0</div>
                  <div className="text-[10px] text-rose-600 font-medium">Dead Letter</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
