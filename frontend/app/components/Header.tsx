'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Shield, PauseCircle, PlayCircle, Info, ChevronRight } from 'lucide-react';
import { isDemoModeActive, getRecoveryStatus, pauseRecovery, resumeRecovery } from '../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onMenuToggle, actions }) => {
  const [recoveryRunning, setRecoveryRunning] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

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
    <header className="h-[56px] bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30"
            style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}>
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold text-slate-900 leading-tight truncate">{title}</h1>
            {isDemoModeActive && (
              <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <Info className="w-3 h-3" /> DEMO
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-44 lg:w-52 pl-8 pr-8 py-[5px] text-[12px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 focus:bg-white focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-slate-400"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded px-1 py-[1px] hidden lg:block">⌘K</kbd>
        </div>

        {/* Recovery Toggle */}
        <button
          onClick={handleToggleRecovery}
          disabled={loadingAction}
          className={`flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg text-[11px] font-semibold border transition-all ${
            recoveryRunning
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          {recoveryRunning ? (
            <><span className="w-[6px] h-[6px] rounded-full bg-emerald-500 rf-pulse-dot" /><span className="hidden sm:inline">Running</span></>
          ) : (
            <><PauseCircle className="w-3.5 h-3.5" /><span className="hidden sm:inline">Paused</span></>
          )}
        </button>

        {/* Security */}
        <div className="hidden lg:flex items-center gap-1 px-2 py-[5px] rounded-lg text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200">
          <Shield className="w-3 h-3 text-cyan-600" />
          <span>Secured</span>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full bg-cyan-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
