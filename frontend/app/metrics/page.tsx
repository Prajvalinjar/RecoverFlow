'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { KpiCard } from '../components/KpiCard';
import { getOperationsMetrics, MetricSummary } from '../lib/api';
import { BarChart3, TrendingUp, DollarSign, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function MetricsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    getOperationsMetrics().then((res) => setMetrics(res.data));
  }, []);

  const chartData = [
    { date: 'Aug 17', total: 160, recovered: 120, at_risk: 32000, protected: 24500 },
    { date: 'Aug 18', total: 175, recovered: 132, at_risk: 35000, protected: 27100 },
    { date: 'Aug 19', total: 190, recovered: 145, at_risk: 41000, protected: 32000 },
    { date: 'Aug 20', total: 182, recovered: 139, at_risk: 38000, protected: 29500 },
    { date: 'Aug 21', total: 205, recovered: 158, at_risk: 46000, protected: 36200 },
    { date: 'Aug 22', total: 220, recovered: 172, at_risk: 49000, protected: 39100 },
    { date: 'Aug 23', total: 108, recovered: 84, at_risk: 24000, protected: 18800 },
  ];

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header
          title="Recovery Metrics & Analytics"
          subtitle="Deep domain analytics, recovery volume trends & conversion metrics"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-container space-y-6">
          {/* Header Controls */}
          <div className="fintech-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Performance Overview</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                  timeRange === '7d' ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                  timeRange === '30d' ? 'bg-sky-500 text-white border-sky-500' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Recovery Conversion"
              value={`${metrics?.recovery_rate_percent || 74.26}%`}
              change="+3.8%"
              trend="up"
              subtext="avg conversion"
              icon={TrendingUp}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KpiCard
              title="Revenue Protected"
              value={`$${parseFloat(metrics?.revenue_recovered || '182450.00').toLocaleString()}`}
              change="+18.5%"
              trend="up"
              subtext="net recovered"
              icon={DollarSign}
              iconBgColor="bg-sky-50"
              iconColor="text-sky-600"
            />
            <KpiCard
              title="Avg Attempts To Recover"
              value={`${metrics?.average_attempts || 1.84}`}
              change="-0.2"
              trend="up"
              subtext="attempts / case"
              icon={RefreshCw}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
            <KpiCard
              title="Policy Rejections"
              value="0"
              change="0%"
              trend="neutral"
              subtext="100% compliant"
              icon={ShieldCheck}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-600"
            />
          </div>

          {/* Area Chart: Recovery Volume */}
          <div className="fintech-card p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recovery Volume & Conversion</h3>
              <p className="text-xs text-slate-500">Total ingested cases vs successfully recovered cases</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="total" name="Total Ingested Cases" stroke="#94A3B8" fill="#F1F5F9" />
                  <Area type="monotone" dataKey="recovered" name="Recovered Cases" stroke="#10B981" fill="#D1FAE5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
