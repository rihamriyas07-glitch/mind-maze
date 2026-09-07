import React, { useState } from 'react';
import { ScreenId, StreamType } from '../types';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BookOpen,
  BarChart3,
  Bell,
  BellRing,
  GraduationCap,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { sendStudyNotification, playStudyChime } from '../lib/notificationService';

interface NavbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  stream: StreamType;
  onSelectStream: (stream: StreamType) => void;
  physicalScienceElective?: 'Chemistry' | 'ICT';
  onSelectElective?: (elective: 'Chemistry' | 'ICT') => void;
  notificationPermission: NotificationPermission | 'unsupported';
  onRequestNotificationPermission: () => void;
  currentStreak?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  stream,
  onSelectStream,
  physicalScienceElective = 'Chemistry',
  onSelectElective,
  notificationPermission,
  onRequestNotificationPermission,
  currentStreak = 0,
}) => {
  const [isStreamDropdownOpen, setIsStreamDropdownOpen] = useState(false);
  const [showTestBanner, setShowTestBanner] = useState(false);

  // Strictly GCE A/L Physical Science and Biological Science only
  const streams: { id: StreamType; label: string; shortLabel: string; icon: string; subjectsSummary: string }[] = [
    {
      id: 'Physical Science',
      label: 'Physical Science',
      shortLabel: 'Physical Science',
      icon: '📐',
      subjectsSummary: 'Combined Maths + Physics + Chem / ICT',
    },
    {
      id: 'Biological Science',
      label: 'Biological Science',
      shortLabel: 'Bio Science',
      icon: '🔬',
      subjectsSummary: 'Biology + Chemistry + Physics',
    },
  ];

  const currentStreamInfo =
    streams.find(
      (s) =>
        s.id === stream ||
        (stream === 'Maths' && s.id === 'Physical Science') ||
        (stream === 'Bio' && s.id === 'Biological Science')
    ) || streams[0];

  const navItems: { id: ScreenId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'daily', label: 'Daily Planner', icon: CheckSquare },
    { id: 'topics', label: 'Topics', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ];

  const handleTestReminder = () => {
    playStudyChime();
    sendStudyNotification(
      '🔔 Test Study Reminder',
      'This is how your Mind Maze GCE A/L timetable reminders will look and sound!'
    );
    setShowTestBanner(true);
    setTimeout(() => setShowTestBanner(false), 4000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0F1023]/90 backdrop-blur-xl">
      {/* Test reminder confirmation toast */}
      {showTestBanner && (
        <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 border-b border-cyan-400/30 px-4 py-2 text-center text-xs text-cyan-300 animate-fadeIn flex items-center justify-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span>Reminder triggered! Audio chime played & notification dispatched.</span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Logo size="sm" onClick={() => onNavigate('dashboard')} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#6B4EFF] text-white shadow-[0_0_12px_rgba(107,78,255,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stream Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="btn-stream-selector"
                onClick={() => setIsStreamDropdownOpen(!isStreamDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition cursor-pointer min-h-[44px]"
                title="Change A/L Stream"
              >
                <span className="text-sm">{currentStreamInfo.icon}</span>
                <span className="hidden sm:inline">{currentStreamInfo.shortLabel}</span>
                <span className="text-[10px] text-cyan-400 font-bold ml-0.5">▼</span>
              </button>

              {isStreamDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/15 bg-[#161831] p-2.5 shadow-2xl z-50 animate-fadeIn text-xs"
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Select A/L Stream</span>
                    <span className="text-cyan-400 font-normal">GCE A/L Sri Lanka</span>
                  </div>

                  <div className="space-y-1.5 mt-1">
                    {streams.map((s) => {
                      const isSelected =
                        stream === s.id ||
                        (s.id === 'Physical Science' && stream === 'Maths') ||
                        (s.id === 'Biological Science' && stream === 'Bio');
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSelectStream(s.id);
                            setIsStreamDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#6B4EFF]/20 border border-[#6B4EFF]/50 text-cyan-300 font-bold'
                              : 'text-slate-200 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <span className="text-xl mt-0.5">{s.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-white">{s.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{s.subjectsSummary}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* If Physical Science is chosen, show the 3rd elective toggle inside dropdown as well */}
                  {(stream === 'Physical Science' || stream === 'Maths') && onSelectElective && (
                    <div className="mt-2 pt-2 border-t border-white/10 px-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Physical Science 3rd Subject Elective:
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectElective('Chemistry');
                            setIsStreamDropdownOpen(false);
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            physicalScienceElective === 'Chemistry'
                              ? 'bg-purple-500/30 border border-purple-400/50 text-purple-200'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span>🧪</span>
                          <span>Chemistry</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectElective('ICT');
                            setIsStreamDropdownOpen(false);
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            physicalScienceElective === 'ICT'
                              ? 'bg-pink-500/30 border border-pink-400/50 text-pink-200'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span>💻</span>
                          <span>ICT</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Study Streak Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-black transition cursor-pointer ${
                currentStreak > 0
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
              title={`Study Streak: ${currentStreak} days`}
              onClick={() => onNavigate('daily')}
            >
              <span className="text-sm leading-none">🔥</span>
              <span>{currentStreak}d</span>
            </div>

            {/* Notification & Reminder Bell */}
            <button
              onClick={
                notificationPermission === 'granted'
                  ? handleTestReminder
                  : onRequestNotificationPermission
              }
              id="btn-navbar-reminders"
              title={
                notificationPermission === 'granted'
                  ? 'Notifications active! Click to test reminder sound'
                  : 'Enable browser study reminders'
              }
              className={`p-2.5 rounded-xl border transition flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px] ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {notificationPermission === 'granted' ? (
                <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton variant="nav" />
          </div>
        </div>
      </div>
    </header>
  );
};
