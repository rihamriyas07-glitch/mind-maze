import React from 'react';
import { ScreenId, UserProfile } from '../types';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  BookmarkCheck,
  Target,
  BarChart3,
  SlidersHorizontal,
  Home,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lightbulb,
  CalendarDays,
  User,
  LogIn,
} from 'lucide-react';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mistakesCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  userProfile?: UserProfile;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  mistakesCount = 3,
  isOpenMobile = false,
  onCloseMobile,
  userProfile,
  onOpenAuth,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ScreenId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'study-plan' as ScreenId,
      label: 'Study Plans & Routine',
      icon: CalendarDays,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      id: 'practice' as ScreenId,
      label: 'AI Practice Quiz',
      icon: Sparkles,
      badge: 'Soon',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'past-papers' as ScreenId,
      label: 'Past Paper Library',
      icon: BookOpen,
      badge: 'Soon',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'mistakes' as ScreenId,
      label: 'Mistake Notebook',
      icon: BookmarkCheck,
      badge: 'Soon',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'targets' as ScreenId,
      label: 'Smart Targets & XP',
      icon: Target,
      badge: 'Soon',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'analytics' as ScreenId,
      label: 'Analytics & Repeat AI',
      icon: BarChart3,
      badge: 'Soon',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
  ];

  const secondaryItems = [
    {
      id: 'onboarding' as ScreenId,
      label: 'Stream & Preferences',
      icon: SlidersHorizontal,
    },
    {
      id: 'landing' as ScreenId,
      label: 'Landing Page',
      icon: Home,
    },
  ];

  const handleSelect = (screenId: ScreenId) => {
    onNavigate(screenId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        id="mind-maze-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-[#161831] backdrop-blur-md transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Top spacer / header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6B4EFF]/20 border border-[#6B4EFF]/40 text-cyan-400">
              <Lightbulb className="h-4 w-4" />
            </div>
            {(!isCollapsed || isOpenMobile) && (
              <span className="font-bold text-sm tracking-wide text-white truncate">
                Study Portal
              </span>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Core Study Tools
              </div>
            )}
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-white/10 text-cyan-400 border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                      }`}
                    />

                    {(!isCollapsed || isOpenMobile) && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {(!isCollapsed || isOpenMobile) && item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.badgeColor || 'bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip on collapsed desktop */}
                    {isCollapsed && !isOpenMobile && (
                      <div className="pointer-events-none absolute left-full ml-3 hidden rounded-xl bg-[#161831] border border-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-xl group-hover:block z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Study Pro-Tip Card (when expanded) */}
          {(!isCollapsed || isOpenMobile) && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-xs text-slate-300 shadow-inner">
              <div className="flex items-center gap-2 font-semibold text-cyan-300 mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Repeat Question AI</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Projectile Motion & Le Chatelier appear in 75%+ of papers since 2015.
              </p>
            </div>
          )}

          {/* Secondary links */}
          <div>
            {(!isCollapsed || isOpenMobile) && (
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Setup & Info
              </div>
            )}
            <div className="space-y-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-link-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold border border-white/10'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {(!isCollapsed || isOpenMobile) && (
                      <span className="truncate text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info & User session */}
        {(!isCollapsed || isOpenMobile) && (
          <div className="border-t border-white/10 p-3.5 space-y-2">
            {userProfile && (
              <div
                onClick={() => (onOpenAuth ? onOpenAuth('signin') : onNavigate('onboarding'))}
                className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/40 hover:bg-white/10 transition-all cursor-pointer"
                title="Manage Account or Switch User"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {userProfile.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0 border border-cyan-400/50"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#6B4EFF] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {userProfile.name ? userProfile.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate">
                      {userProfile.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {userProfile.stream} Stream
                    </div>
                  </div>
                </div>
                <LogIn className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </div>
            )}
            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span>Sri Lankan GCE A/L</span>
              <span className="text-cyan-400 font-mono">v2.4</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
