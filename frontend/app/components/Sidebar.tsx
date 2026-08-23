'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import {
  LayoutDashboard, RefreshCw, CreditCard, Layers, BarChart3,
  GitMerge, Activity, Server, FileText, Sliders, Settings,
  Globe, UserCheck, X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Product Landing', href: '/', icon: Globe },
      { label: 'Operations Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'RECOVERY',
    items: [
      { label: 'Recovery Cases', href: '/cases', icon: RefreshCw, badge: '142' },
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Jobs & Queue', href: '/jobs', icon: Layers, badge: '4' },
      { label: 'Reconciliation', href: '/reconciliation', icon: GitMerge },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { label: 'Recovery Metrics', href: '/metrics', icon: BarChart3 },
      { label: 'Recovery Flow', href: '/flow', icon: Activity },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Provider Health', href: '/providers', icon: Server },
      { label: 'System Health', href: '/system', icon: Activity },
      { label: 'Audit Trail', href: '/audit', icon: FileText },
      { label: 'Operations Control', href: '/operations', icon: Sliders },
    ],
  },
  {
    title: 'SYSTEM',
    items: [{ label: 'Settings', href: '/settings', icon: Settings }],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[252px] flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0B1F33' }}
      >
        {/* Brand */}
        <div className="h-[60px] px-5 flex items-center justify-between border-b border-white/[0.08]">
          <Logo variant="dark" size="md" />
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Environment */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center justify-between"
             style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 rf-pulse-dot" />
            <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Environment
            </span>
          </div>
          <span className="px-2 py-[2px] rounded text-[10px] font-bold text-amber-300 border border-amber-500/30"
                style={{ background: 'rgba(245,158,11,0.12)' }}>
            TEST
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center justify-between px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                      style={isActive ? { background: 'rgba(14, 165, 233, 0.12)' } : {}}
                    >
                      <div className="flex items-center gap-2.5">
                        {isActive && (
                          <span className="absolute left-0 w-[3px] h-5 rounded-r-full bg-cyan-400" />
                        )}
                        <Icon className={`w-[16px] h-[16px] ${
                          isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                        }`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-1.5 py-[1px] text-[10px] font-bold rounded-md ${
                          isActive
                            ? 'bg-cyan-400/20 text-cyan-300'
                            : 'bg-white/[0.06] text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.15)' }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                 style={{ background: 'linear-gradient(135deg, #0EA5E9, #10B981)' }}>
              OA
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-[13px] font-semibold text-white truncate">Ops Admin</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                <UserCheck className="w-3 h-3 text-emerald-400" /> ADMIN
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
