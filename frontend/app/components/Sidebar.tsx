'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  RefreshCw,
  CreditCard,
  Layers,
  BarChart3,
  GitMerge,
  Activity,
  Server,
  FileText,
  Sliders,
  Settings,
  ShieldAlert,
  ChevronRight,
  Globe,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();

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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B1F33] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 bg-[#081726]">
          <Logo variant="dark" size="md" />
        </div>

        {/* Environment Badge Indicator */}
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
              Environment
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            TEST / SANDBOX
          </span>
        </div>

        {/* Navigation Section Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-sky-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Role Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#081726] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              OA
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-white truncate">Ops Admin</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                <UserCheck className="w-3 h-3 text-emerald-400" /> ADMIN ROLE
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
