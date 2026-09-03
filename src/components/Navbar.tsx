import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { ScreenId, UserProfile } from '../types';
import {
  Flame,
  Shield,
  Sparkles,
  Clock,
  Menu,
  X,
  Brain,
  BookOpen,
  User,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
  UserCheck,
  LogIn,
  UserPlus,
} from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  userProfile: UserProfile;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  userProfile,
  onToggleSidebar,
  isSidebarOpen = false,
  onOpenAuth,
  onSignOut,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute exam days remaining
  const calculateDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date('2026-09-01').getTime(); // Based on current environment time
    const diff = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
    return diff;
  };

  const daysLeft = calculateDaysRemaining(userProfile.examDate || '2026-11-15');
  const isAuthenticated = Boolean(userProfile?.isAuthenticated === true && userProfile?.email);

  return (
    <header
      id="mind-maze-header-nav"
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#161831]/85 backdrop-blur-md transition-all duration-200"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Hamburger (for mobile) & Logo */}
        <div className="flex items-center gap-3">
          {currentScreen !== 'landing' && onToggleSidebar && (
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-[#6B4EFF]/20 hover:text-white lg:hidden cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          <Logo
            size="sm"
            onClick={() => onNavigate(currentScreen === 'landing' ? 'landing' : 'dashboard')}
          />
        </div>

        {/* Center / Stats (Visible on app screens or landing CTA) */}
        {currentScreen === 'landing' ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => {
                const el = document.getElementById('features-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('subjects-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Subjects
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('repeat-topics-teaser');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Repeat Topics
            </button>
            <button
              onClick={() => onNavigate('past-papers')}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 text-slate-300 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#6B4EFF]" />
              Paper Archive
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            {/* Stream & Target pill */}
            <div className="flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{userProfile.stream} Stream</span>
              <span className="text-slate-400">•</span>
              <span className="text-cyan-400">{userProfile.targetGrade}</span>
            </div>

            {/* A/L Countdown */}
            <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-xs font-medium text-cyan-300">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                <strong className="text-white font-semibold">{daysLeft}</strong> days to A/L
              </span>
            </div>
          </div>
        )}

        {/* Right Action Icons / Auth / Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentScreen === 'landing' ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {isAuthenticated ? (
                <>
                  <button
                    id="btn-nav-dashboard"
                    onClick={() => onNavigate('dashboard')}
                    className="px-4 py-2 text-xs font-semibold text-white rounded-xl bg-[#6B4EFF] hover:bg-[#7C5DFA] transition-all shadow-[0_0_15px_rgba(107,78,255,0.4)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Dashboard</span>
                  </button>

                  {/* User Avatar Menu Trigger */}
                  <div className="relative" ref={menuRef}>
                    <button
                      id="btn-nav-user-profile"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {userProfile.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt={userProfile.name}
                          className="w-7 h-7 rounded-full object-cover border border-cyan-400/50"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#6B4EFF] text-white flex items-center justify-center font-bold text-xs">
                          {userProfile.name.charAt(0)}
                        </div>
                      )}
                      <span className="hidden sm:inline-block text-xs font-bold text-white max-w-[100px] truncate">
                        {userProfile.name.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/15 bg-[#161831] p-3 text-slate-200 shadow-2xl z-50 backdrop-blur-xl animate-fade-in">
                        <div className="p-2 border-b border-white/10 pb-3 mb-2">
                          <div className="font-bold text-sm text-white truncate">
                            {userProfile.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {userProfile.email || 'student@alstudy.lk'}
                          </div>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-cyan-300 font-semibold">
                            {userProfile.provider === 'google' ? (
                              <>
                                <svg className="w-3 h-3" viewBox="0 0 24 24">
                                  <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  />
                                  <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  />
                                  <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                  />
                                  <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                  />
                                </svg>
                                <span>Google Account</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 text-cyan-300" />
                                <span>Email Account</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onNavigate('onboarding');
                            }}
                            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                          >
                            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                            <span>Edit Stream & Preferences</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              if (onOpenAuth) onOpenAuth('signin');
                            }}
                            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                          >
                            <LogIn className="w-4 h-4 text-cyan-400" />
                            <span>Switch / Add Account</span>
                          </button>

                          {onSignOut && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onSignOut();
                              }}
                              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    id="btn-nav-login"
                    onClick={() => (onOpenAuth ? onOpenAuth('signin') : onNavigate('dashboard'))}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    id="btn-nav-start-free"
                    onClick={() => (onOpenAuth ? onOpenAuth('signup') : onNavigate('onboarding'))}
                    className="bg-[#6B4EFF] hover:bg-[#7C5DFA] px-5 py-2 rounded-xl font-bold text-xs text-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(107,78,255,0.4)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Daily MCQ Progress ring pill */}
              <div
                title="Daily MCQ Progress"
                onClick={() => onNavigate('targets')}
                className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs cursor-pointer hover:border-purple-400/40 transition-colors backdrop-blur-md"
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-700/60"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-cyan-400"
                      strokeDasharray={`${(userProfile.dailyCompletedMCQs / userProfile.dailyGoalMCQs) * 100}, 100`}
                      strokeWidth="4"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-slate-200">
                  {userProfile.dailyCompletedMCQs}/{userProfile.dailyGoalMCQs}{' '}
                  <span className="text-slate-400 text-[10px]">MCQ</span>
                </span>
              </div>

              {/* Streak Counter Pill */}
              <div
                title={`${userProfile.streakDays} Day Study Streak`}
                className="flex items-center gap-2 bg-[#6B4EFF]/20 px-3.5 py-1.5 rounded-full border border-[#6B4EFF]/40 text-xs font-bold text-white shadow-[0_0_10px_rgba(107,78,255,0.2)]"
              >
                <Flame className="h-4 w-4 text-orange-400 fill-orange-400 animate-bounce" />
                <span>{userProfile.streakDays} Days</span>
                {userProfile.streakFreezes > 0 && (
                  <span
                    title={`${userProfile.streakFreezes} Streak Freezes Available`}
                    className="flex items-center text-cyan-400 ml-0.5"
                  >
                    <Shield className="h-3 w-3 fill-cyan-400/30" />
                    <span className="text-[10px] ml-0.5">{userProfile.streakFreezes}</span>
                  </span>
                )}
              </div>

              {/* XP Counter */}
              <div
                title={`${userProfile.xp} Knowledge XP`}
                className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-300"
              >
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                <span>{userProfile.xp} XP</span>
              </div>

              {/* User Account / Avatar Dropdown OR Guest Sign In */}
              {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                  <button
                    id="btn-nav-user-account"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    title="User Profile & Settings"
                  >
                    {userProfile.avatar ? (
                      <img
                        src={userProfile.avatar}
                        alt={userProfile.name}
                        className="w-7 h-7 rounded-full object-cover border border-cyan-400/60"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#6B4EFF] text-white flex items-center justify-center font-bold text-xs">
                        {userProfile.name ? userProfile.name.charAt(0) : 'U'}
                      </div>
                    )}
                    <span className="hidden lg:inline-block text-xs font-semibold text-slate-200 max-w-[90px] truncate">
                      {userProfile.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/15 bg-[#161831] p-3 text-slate-200 shadow-2xl z-50 backdrop-blur-xl animate-fade-in">
                      <div className="p-2 border-b border-white/10 pb-3 mb-2">
                        <div className="font-bold text-sm text-white truncate">
                          {userProfile.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {userProfile.email || 'student@alstudy.lk'}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                            {userProfile.stream} Stream
                          </span>
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                            {userProfile.targetGrade}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('onboarding');
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                          <span>Stream & Preferences</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenAuth) onOpenAuth('signin');
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 text-cyan-400" />
                          <span>Switch Account</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            if (onOpenAuth) onOpenAuth('signup');
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-emerald-400" />
                          <span>Register New Student</span>
                        </button>

                        {onSignOut && (
                          <div className="pt-1 mt-1 border-t border-white/10">
                            <button
                              id="btn-nav-signout-main"
                              type="button"
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                onSignOut();
                              }}
                              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="btn-nav-guest-signin"
                    onClick={() => (onOpenAuth ? onOpenAuth('signin') : onNavigate('dashboard'))}
                    className="px-3.5 py-1.5 text-xs font-bold text-white rounded-xl bg-[#6B4EFF] hover:bg-[#7C5DFA] transition-all shadow-[0_0_12px_rgba(107,78,255,0.3)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
