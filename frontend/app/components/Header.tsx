'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Shield, PauseCircle, PlayCircle, Info } from 'lucide-react';
import { isDemoModeActive, getRecoveryStatus, pauseRecovery, resumeRecovery } from '../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuToggle }) => {
  const [recoveryRunning, setRecoveryRunning] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    getRecoveryStatus().then(res => {
      setRecoveryRunning(res.status === 'RUNNING');
    });
  }, []);

  const handleToggleRecovery = async () => {
    setLoadingAction(true);
    if (recoveryRunning) {
      await pauseRecovery();
      setRecoveryRunning(false);
    } else {
      await resumeRecovery();
      setRecoveryRunning(true);
    }
    setLoadingAction(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
            {isDemoModeActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Backend API fallback active">
                <Info className="w-3 h-3 text-amber-500" /> Demo Mode
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cases, payments..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
          />
        </div>

        {/* System Operations Toggle */}
        <button
          onClick={handleToggleRecovery}
          disabled={loadingAction}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            recoveryRunning
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          {recoveryRunning ? (
            <>
              <PauseCircle className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Recovery RUNNING</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Recovery PAUSED</span>
            </>
          )}
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900">Operational Alerts</h4>
                <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">2 New</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-100">
                  <div className="font-semibold text-slate-800">Razorpay TEST Provider Active</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">148 executions processed cleanly without failure.</div>
                  <div className="text-[10px] text-slate-400 mt-1">2 mins ago</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-800">Worker Node A Active</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Durable queue lease auto-renewed.</div>
                  <div className="text-[10px] text-slate-400 mt-1">10 mins ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Boundary Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-sky-600" />
          <span>Security Boundary Active</span>
        </div>
      </div>
    </header>
  );
};
