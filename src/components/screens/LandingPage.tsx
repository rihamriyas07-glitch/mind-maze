import React, { useState } from 'react';
import { ScreenId, StreamType } from '../../types';
import { Logo } from '../Logo';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Target,
  Brain,
  BookmarkCheck,
  Flame,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  Layers,
  ChevronRight,
  Atom,
  FlaskConical,
  Calculator,
  Dna,
  Laptop,
  MessageCircle,
  Clock,
  HelpCircle,
  RotateCcw,
  CalendarDays,
} from 'lucide-react';
import { ComingSoonModal } from '../ComingSoonModal';

interface LandingPageProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectStreamAndStart?: (stream: StreamType) => void;
  onOpenAuth?: (mode: 'signin' | 'signup', stream?: StreamType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onSelectStreamAndStart,
  onOpenAuth,
}) => {
  const [comingSoonSubject, setComingSoonSubject] = useState<string | null>(null);

  const subjectChips = [
    { name: 'Study Routine Engine', icon: CalendarDays, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', isLive: true },
    { name: 'Physics Question Bank', icon: Atom, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', isLive: false },
    { name: 'Chemistry Questions', icon: FlaskConical, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', isLive: false },
    { name: 'Biology Questions', icon: Dna, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', isLive: false },
  ];

  const subjects = [
    {
      name: 'GCE A/L Study Routine & Planner',
      code: 'Structured Revision Plans, Weekly Timetables & Daily Topics',
      icon: CalendarDays,
      color: 'from-emerald-600 to-teal-800',
      badge: '⚡ 100% Live & Ready',
      isLive: true,
      stream: 'Maths' as StreamType,
      topTopics: ['Mechanics Mastery Sprint', 'Weekly Study Timetable', 'Daily Syllabus Topics'],
    },
    {
      name: 'Physics (2000-2026 Archive & MCQs)',
      code: 'Theory, Units & Practical Applications',
      icon: Atom,
      color: 'from-purple-600 to-violet-800',
      badge: '⏳ Coming Soon',
      isLive: false,
      stream: 'Maths' as StreamType,
      topTopics: ['Projectile Apex Curvature', 'Kirchhoff Circuit Laws', 'Bernoulli & Waves'],
    },
    {
      name: 'Chemistry',
      code: 'Organic, Inorganic & Physical Chemistry',
      icon: FlaskConical,
      color: 'from-amber-600 to-orange-800',
      badge: '⏳ Coming Soon',
      isLive: false,
      stream: 'Bio' as StreamType,
      topTopics: ['Le Chatelier Equilibrium', 'Organic Mechanisms', 'Electrochemistry'],
    },
    {
      name: 'Biology',
      code: 'Genetics, Plant & Animal Physiology',
      icon: Dna,
      color: 'from-rose-600 to-pink-800',
      badge: '⏳ Coming Soon',
      isLive: false,
      stream: 'Bio' as StreamType,
      topTopics: ['DNA Replication Enzymes', 'Photosynthesis C3/C4', 'Ecology & Genetics'],
    },
    {
      name: 'ICT',
      code: 'Database, Networking & Programming',
      icon: Laptop,
      color: 'from-cyan-600 to-blue-800',
      badge: '⏳ Coming Soon',
      isLive: false,
      stream: 'Maths' as StreamType,
      topTopics: ['Relational Database 3NF', 'IP Subnetting /26', 'Python Data Structures'],
    },
  ];

  const features = [
    {
      icon: CalendarDays,
      title: 'Study Plans, Timetable & Daily Topics',
      desc: 'Structured unit-wise revision plans, interactive weekly study timetables, and high-yield daily syllabus coverage checklists with step-by-step drills.',
      accent: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
    {
      icon: BookOpen,
      title: 'Past Paper Archive (2000 to 2026)',
      desc: 'Complete categorized repository with Old vs Current syllabus segregation, Sinhala, English & Tamil mediums, and verified answer keys.',
      accent: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    },
    {
      icon: Brain,
      title: 'AI Question Practice & Instant Tutoring',
      desc: 'Smart MCQ engine with step-by-step solution breakdowns and instant diagnostic popups whenever you pick an incorrect option.',
      accent: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    },
    {
      icon: BookmarkCheck,
      title: 'Learn From Mistakes Notebook',
      desc: 'Never repeat the same error. Incorrect answers automatically populate your Mistake Notebook with mini-lessons and retry drills.',
      accent: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    },
  ];

  return (
    <div id="mind-maze-landing-view" className="relative min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/40 bg-purple-500/15 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-[0_0_15px_rgba(107,78,255,0.3)] backdrop-blur-md mb-4">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span>Dedicated Study Plans & Revision Routine for GCE A/L</span>
            </div>

            {/* Main Tagline */}
            <h1 className="mt-2 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build a Disciplined Revision Routine for{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#6B4EFF] via-[#8B5CF6] to-cyan-400 bg-clip-text text-transparent">
                  GCE A/L
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-[#6B4EFF] to-cyan-400" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
              Follow structured syllabus revision plans, manage your weekly study timetable, and systematically track daily high-yield topics.
            </p>

            {/* Subject Chips */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl">
              <span className="text-xs font-semibold text-slate-400 mr-1">Supported Subjects:</span>
              {subjectChips.map((chip) => {
                const ChipIcon = chip.icon;
                return (
                  <button
                    key={chip.name}
                    onClick={() => {
                      if (chip.isLive) {
                        onNavigate('practice');
                      } else {
                        setComingSoonSubject(chip.name);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all hover:scale-105 cursor-pointer ${chip.color}`}
                  >
                    <ChipIcon className="w-3.5 h-3.5" />
                    <span>{chip.name}</span>
                    {!chip.isLive && (
                      <span className="text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.2 rounded-full font-bold">Soon</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
              <button
                id="btn-hero-start-free"
                onClick={() => (onOpenAuth ? onOpenAuth('signup') : onNavigate('onboarding'))}
                className="group relative flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-[#6B4EFF] hover:bg-[#7C5DFA] px-8 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(107,78,255,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Start Free (Sign Up)</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="btn-hero-explore-quiz"
                onClick={() => onNavigate('practice')}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-7 py-4 text-base font-semibold text-slate-200 hover:bg-white/20 transition-all backdrop-blur-md cursor-pointer"
              >
                <Brain className="h-5 w-5 text-cyan-300" />
                <span>Try Instant Quiz</span>
              </button>
            </div>

            {/* Quick Sign-In Option */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>Already registered?</span>
              <button
                type="button"
                onClick={() => (onOpenAuth ? onOpenAuth('signin') : onNavigate('dashboard'))}
                className="font-bold text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Sign in with Google or Email</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TWO CONTENT STREAM MODE CARDS */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Two Learning Streams • One Complete MCQ Engine
            </h2>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
              Choose How You Practice Today
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode Card 1: 🎯 Daily Quiz */}
            <div
              onClick={() => onNavigate('practice')}
              className="group relative rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#1E1744]/70 to-[#12142B]/90 p-7 backdrop-blur-xl hover:border-[#6B4EFF] transition-all hover:-translate-y-1 shadow-xl cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                    <Zap className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="rounded-full bg-purple-500/20 border border-purple-400/40 px-3 py-1 text-[11px] font-bold text-cyan-300">
                    Level Up & Earn XP
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    🎯 Daily Quiz — practice and level up
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Original practice questions designed to test core principles, sharpen problem-solving speed, build your daily streak, and boost your mastery ring.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant grading with 4–5 options and timer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Step-by-step reasoning popup on incorrect attempts</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 group-hover:text-cyan-300 flex items-center gap-1">
                  Start Daily Quiz <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] text-slate-400 font-medium">+25 XP per MCQ</span>
              </div>
            </div>

            {/* Mode Card 2: 📜 Past Paper MCQs */}
            <div
              onClick={() => onNavigate('past-papers')}
              className="group relative rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#0B253A]/70 to-[#12142B]/90 p-7 backdrop-blur-xl hover:border-cyan-400 transition-all hover:-translate-y-1 shadow-xl cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                    <BookOpen className="h-6 w-6 text-cyan-300" />
                  </div>
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-400/40 px-3 py-1 text-[11px] font-bold text-cyan-300">
                    2000 – 2026 Archive
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    📜 Past Paper MCQs — real exam questions with answers & explanations
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Practice real past paper MCQs from 2000–2025 and new 2026 Model Papers with verified step-by-step solutions, marking keys, and syllabus filtering.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Real Department of Examinations past papers & 2026 Model Papers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Current vs Old syllabus toggle with step-by-step reasoning</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  Explore Past Paper Library <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-[11px] text-slate-400 font-medium">4 Core Subjects</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features-section" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Everything You Need for A/L Success
            </h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engineered Specifically for Sri Lankan A/L Students
            </p>
            <p className="mt-3 text-base text-slate-400">
              Designed around the exact Department of Examinations past paper structures and grading criteria.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="group relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-[#6B4EFF]/50 shadow-sm"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${feat.accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects Explorer Section */}
      <section id="subjects-section" className="py-16 border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                Curriculum Coverage
              </span>
              <h2 className="mt-1 text-3xl font-black text-white">
                4 Core A/L Subjects
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Full MCQ practice coverage with verified solutions and repeat frequency stats.
              </p>
            </div>
            <button
              onClick={() => onNavigate('past-papers')}
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:underline cursor-pointer"
            >
              Browse all past paper sets <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subj, idx) => {
              const Icon = subj.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:border-[#6B4EFF]/50 transition-all group flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${subj.color} text-white shadow-lg`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 border border-white/10">
                        {subj.badge}
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-slate-400">{subj.code}</p>

                    <div className="mt-4 space-y-1.5">
                      <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider">
                        High-Repeat Topics:
                      </div>
                      {subj.topTopics.map((top, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          <span>{top}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (subj.isLive) {
                          onNavigate('practice');
                        } else {
                          setComingSoonSubject(subj.name);
                        }
                      }}
                      className="text-xs font-bold text-white flex items-center gap-1 group-hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      {subj.isLive ? (
                        <>Practice Questions <ArrowRight className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Coming Soon <Clock className="w-3.5 h-3.5 text-amber-400" /></>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">{subj.isLive ? 'MCQ Live' : 'In Pipeline'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Banner with WhatsApp Group */}
      <section className="py-12 border-t border-white/10 bg-gradient-to-r from-[#12142B] via-[#1A1840] to-[#12142B]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 sm:p-10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                <MessageCircle className="w-3.5 h-3.5" />
                Sri Lankan A/L Student Community
              </div>
              <h3 className="text-2xl font-bold text-white">Join 15,000+ A/L Students on WhatsApp</h3>
              <p className="text-sm text-slate-300 max-w-lg">
                Get daily high-yield MCQs, marking scheme discussions, and exam countdown study reminders directly on your phone.
              </p>
            </div>

            <a
              href="https://chat.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              id="btn-join-whatsapp-hero"
              className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 py-3.5 text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 shrink-0"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>Join our WhatsApp Group</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#161831]/80 backdrop-blur-md py-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" onClick={() => onNavigate('landing')} />

            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
              <button onClick={() => onNavigate('dashboard')} className="hover:text-white cursor-pointer">Dashboard</button>
              <button onClick={() => onNavigate('practice')} className="hover:text-white cursor-pointer">Daily Quiz</button>
              <button onClick={() => onNavigate('past-papers')} className="hover:text-white cursor-pointer">Past Paper MCQs</button>
              <button onClick={() => onNavigate('mistakes')} className="hover:text-white cursor-pointer">Mistake Notebook</button>
              <button onClick={() => onNavigate('targets')} className="hover:text-white cursor-pointer">Targets</button>
              <button onClick={() => onNavigate('analytics')} className="hover:text-white cursor-pointer">Analytics</button>
            </div>

            <a
              href="https://chat.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              id="btn-join-whatsapp-footer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold hover:bg-emerald-500/30 transition-all text-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join our WhatsApp Group</span>
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-slate-500">
            Mind Maze © 2026. Made for Sri Lankan G.C.E. Advanced Level Candidates.
          </div>
        </div>
      </footer>

      {/* Coming Soon Notice Modal */}
      <ComingSoonModal
        isOpen={!!comingSoonSubject}
        subjectName={comingSoonSubject || ''}
        onClose={() => setComingSoonSubject(null)}
        onNavigateToPhysics={() => onNavigate('practice')}
      />
    </div>
  );
};

