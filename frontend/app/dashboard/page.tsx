'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import { RecoveryFlowDiagram } from '../components/RecoveryFlowDiagram';
import {
  getOperationsMetrics,
  getRecoveryCases,
  getProviderHealth,
  getOperationsWorkers,
  MetricSummary,
  CaseItem,
  ProviderHealthItem,
  WorkerItem,
} from '../lib/api';
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Server,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function OperationsDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [recentCases, setRecentCases] = useState<CaseItem[]>([]);
  const [providers, setProviders] = useState<ProviderHealthItem[]>([]);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const [mRes, cRes, pRes, wRes] = await Promise.all([
        getOperationsMetrics(),
        getRecoveryCases(),
        getProviderHealth(),
        getOperationsWorkers(),
      ]);
      setMetrics(mRes.data);
      setRecentCases(cRes.data.slice(0, 5));
      setProviders(pRes.data);
      setWorkers(wRes.data);
      setLoading(false);
    }
    loadDashboardData();
  }, []);

  // Mock Recharts dataset for Recovery Performance over time
  const performanceData = [
    { day: 'Mon', recovery_rate: 68.4, recovered: 24500, at_risk: 32000 },
    { day: 'Tue', recovery_rate: 71.2, recovered: 28900, at_risk: 39000 },
    { day: 'Wed', recovery_rate: 73.8, recovered: 34100, at_risk: 45000 },
    { day: 'Thu', recovery_rate: 72.5, recovered: 31000, at_risk: 42000 },
    { day: 'Fri', recovery_rate: 75.6, recovered: 38500, at_risk: 49000 },
    { day: 'Sat', recovery_rate: 76.9, recovered: 29000, at_risk: 37000 },
    { day: 'Sun', recovery_rate: 78.1, recovered: 32500, at_risk: 41000 },
  ];

  // Pie chart dataset for Recovery Outcomes
  const outcomesData = [
    { name: 'Recovered', value: metrics?.recovered_cases || 890, color: '#10B981' },
    { name: 'Active', value: metrics?.active_cases || 142, color: '#0EA5E9' },
    { name: 'Escalated', value: metrics?.escalated_cases || 74, color: '#8B5CF6' },
    { name: 'Failed', value: metrics?.failed_cases || 86, color: '#EF4444' },
    { name: 'Stopped', value: metrics?.stopped_cases || 48, color: '#64748B' },
  ];

  // Bar chart dataset for Payment Failure Code Breakdown
  const failureBreakdownData = [
    { reason: 'BANK_TIMEOUT', count: 412 },
    { reason: 'NETWORK_FAIL', count: 285 },
    { reason: 'INSUFFICIENT', count: 230 },
    { reason: 'CARD_DECLINED', count: 195 },
    { reason: 'AUTH_FAIL', count: 118 },
  ];

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Operations Dashboard"
          subtitle="Real-time payment recovery command center & operational analytics"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Top KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard
              title="Total Cases"
              value={metrics?.total_cases.toLocaleString() || '1,240'}
              change="+14.2%"
              trend="up"
              subtext="vs last week"
              icon={RefreshCw}
              iconBgColor="bg-slate-100"
              iconColor="text-slate-700"
            />
            <KpiCard
              title="Active Recoveries"
              value={metrics?.active_cases.toLocaleString() || '142'}
              change="+5.1%"
              trend="up"
              subtext="processing"
              icon={Activity}
              iconBgColor="bg-sky-50"
              iconColor="text-sky-600"
            />
            <KpiCard
              title="Revenue At Risk"
              value={`$${parseFloat(metrics?.revenue_at_risk || '245680.50').toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              change="+8.4%"
              trend="up"
              subtext="total risk"
              icon={AlertCircle}
              iconBgColor="bg-rose-50"
              iconColor="text-rose-600"
            />
            <KpiCard
              title="Revenue Recovered"
              value={`$${parseFloat(metrics?.revenue_recovered || '182450.00').toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              change="+18.5%"
              trend="up"
              subtext="protected"
              icon={DollarSign}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KpiCard
              title="Recovery Rate"
              value={`${metrics?.recovery_rate_percent || 74.26}%`}
              change="+3.8%"
              trend="up"
              subtext="conversion"
              icon={TrendingUp}
              iconBgColor="bg-teal-50"
              iconColor="text-teal-600"
            />
            <KpiCard
              title="Execution Success"
              value="98.5%"
              change="+0.5%"
              trend="up"
              subtext="provider rate"
              icon={CheckCircle2}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>

          {/* Core Visualizations Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Recovery Performance Line Chart */}
            <div className="fintech-card p-5 lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recovery Rate Trend</h3>
                  <p className="text-xs text-slate-500">Daily recovery conversion percentage over time</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  +4.2% Avg Growth
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[60, 85]} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                      formatter={(val: any) => [`${val}%`, 'Recovery Rate']}
                    />
                    <Line type="monotone" dataKey="recovery_rate" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4, fill: '#0EA5E9' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Recovery Outcomes Donut Chart */}
            <div className="fintech-card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recovery Outcomes</h3>
                  <p className="text-xs text-slate-500">Case status distribution</p>
                </div>
              </div>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={outcomesData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {outcomesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                {outcomesData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visualizations Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Revenue Recovered vs At Risk Bar Chart */}
            <div className="fintech-card p-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Revenue Recovery Comparison</h3>
                <p className="text-xs text-slate-500">Weekly revenue at risk vs successfully recovered</p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="at_risk" name="Revenue At Risk" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recovered" name="Revenue Recovered" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Failure Code Breakdown */}
            <div className="fintech-card p-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Payment Failure Breakdown</h3>
                <p className="text-xs text-slate-500">Top failure codes triggering recovery flow</p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={failureBreakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                    <YAxis dataKey="reason" type="category" stroke="#94A3B8" fontSize={10} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }} />
                    <Bar dataKey="count" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Autonomous Process Diagram Section */}
          <RecoveryFlowDiagram />

          {/* Tables Row: Recent Recovery Cases & Provider Node Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table 1: Recent Cases */}
            <div className="fintech-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Recovery Cases</h3>
                  <p className="text-xs text-slate-500">Active and recently processed payment recovery cases</p>
                </div>
                <Link href="/cases" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                  View All Cases <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Case ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Failure Reason</th>
                      <th className="py-2.5 px-3">State</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentCases.map((c) => (
                      <tr key={c.case_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">{c.case_id}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{c.customer_name}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">${c.amount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{c.failure_reason}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={c.state} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/cases/${c.case_id}`}
                            className="inline-flex items-center gap-1 text-sky-600 font-semibold hover:underline"
                          >
                            Details <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Provider & Worker Health Sidebar Summary */}
            <div className="space-y-6">
              {/* Provider Status Card */}
              <div className="fintech-card p-5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-900">Active Provider Health</h3>
                  </div>
                  <Link href="/providers" className="text-[11px] font-semibold text-sky-600 hover:underline">
                    Manage
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 uppercase">Razorpay (TEST/SANDBOX)</span>
                      <StatusBadge status="AVAILABLE" size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5 mt-2">
                      <div className="flex justify-between">
                        <span>Circuit Breaker:</span>
                        <span className="font-bold text-emerald-600">CLOSED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Streak:</span>
                        <span className="font-bold text-slate-800">148 executions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workers Node Summary Card */}
              <div className="fintech-card p-5">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-900">Worker Queue Nodes</h3>
                  </div>
                  <Link href="/workers" className="text-[11px] font-semibold text-purple-600 hover:underline">
                    View Queue
                  </Link>
                </div>

                <div className="space-y-2">
                  {workers.map((w) => (
                    <div key={w.worker_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{w.worker_id}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{w.hostname}</div>
                      </div>
                      <StatusBadge status={w.status} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
