import React from 'react';
import { DailyTask, StreamType, SyllabusTopic, TimetableEntry, UserSettings } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Target,
  Trophy,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
  Sparkles,
} from 'lucide-react';
import { SUBJECT_METAS, getSubjectsForStream } from '../../data/alSyllabusData';
import {
  calculateOverallStreamProgression,
  calculateSubjectProgression,
} from '../../lib/syllabusProgression';

interface ProgressAnalyticsProps {
  stream: StreamType;
  syllabusTopics: SyllabusTopic[];
  timetableEntries: TimetableEntry[];
  dailyTasks: DailyTask[];
  settings: UserSettings;
  /** Separate additive habit stat (completing revisions never moves syllabus %). */
  revisionCount?: number;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  stream,
  syllabusTopics,
  timetableEntries,
  dailyTasks,
  settings,
  revisionCount = 0,
}) => {
  const weeklyGoal = settings.weeklyHoursGoal;

  // Get subjects for this student's stream (Physical Science: Combined Maths, Physics, Chem/ICT; Biological Science: Biology, Chem, Physics)
  const streamSubjects = getSubjectsForStream(stream, settings.physicalScienceElective);
  const streamProgression = calculateOverallStreamProgression(streamSubjects, syllabusTopics);

  const totalTopics = streamProgression.totalTopics;
  const completedTopics = streamProgression.completedTopics;
  const inProgressTopics = streamProgression.inProgressTopics;
  const notStartedTopics = streamProgression.notStartedTopics;
  const syllabusPercent = streamProgression.totalPercentage;
  const completedSubtopics = streamProgression.completedSubtopics;
  const totalSubtopics = streamProgression.totalSubtopics;

  // Calculate total weekly timetable hours
  let totalWeeklyMinutes = 0;
  timetableEntries.forEach((entry) => {
    const [sh, sm] = entry.startTime.split(':').map(Number);
    const [eh, em] = entry.endTime.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff > 0) totalWeeklyMinutes += diff;
  });
  const weeklyHours = Math.round((totalWeeklyMinutes / 60) * 10) / 10;
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyHours / weeklyGoal) * 100));

  // Daily task completion stats
  const totalTasksAllTime = dailyTasks.length;
  const completedTasksAllTime = dailyTasks.filter((t) => t.isCompleted).length;

  return (
    <div id="progress-analytics-view" className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#161831] via-[#12142B] to-[#0F1023] p-4 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Revision Analytics • {stream} Stream</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            Progress & Exam Readiness
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track syllabus completion percentages, study hour volume, and your pathway to a top A/L island rank.
          </p>
        </div>

        {/* Big Overall Score Badge */}
        <div className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-[#6B4EFF]/20 border border-[#6B4EFF]/50 shadow-[0_0_20px_rgba(107,78,255,0.3)]">
          <Trophy className="w-8 h-8 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
              Overall Syllabus Covered
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-white">{syllabusPercent}%</span>
              <span className="text-xs text-cyan-300 font-bold">ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weekly Hours vs Target */}
        <div className="rounded-2xl border border-white/10 bg-[#161831]/80 p-5 backdrop-blur-md shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Weekly Study Volume</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{weeklyHours}</span>
            <span className="text-xs text-slate-400">/ {weeklyGoal} hrs planned</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-[#6B4EFF]"
              style={{ width: `${weeklyGoalPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {weeklyGoalPercent >= 100 ? 'Goal exceeded! Outstanding commitment.' : `${Math.round(weeklyGoal - weeklyHours)} more hours needed to reach weekly target.`}
          </p>
        </div>

        {/* Unit Status Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-[#161831]/80 p-5 backdrop-blur-md shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Syllabus Units Breakdown</span>
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{completedTopics}</span>
            <span className="text-xs text-emerald-400">of {totalTopics} completed</span>
          </div>
          <div className="flex gap-1 h-2 w-full rounded-full overflow-hidden">
            <div
              className="bg-emerald-400"
              style={{ width: `${totalTopics === 0 ? 0 : (completedTopics / totalTopics) * 100}%` }}
            />
            <div
              className="bg-amber-400"
              style={{ width: `${totalTopics === 0 ? 0 : (inProgressTopics / totalTopics) * 100}%` }}
            />
            <div
              className="bg-slate-600"
              style={{ width: `${totalTopics === 0 ? 0 : (notStartedTopics / totalTopics) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span className="text-emerald-400 font-bold">{completedTopics} done</span>
            <span className="text-amber-400 font-bold">{inProgressTopics} active</span>
            <span className="text-slate-400 font-bold">{notStartedTopics} pending</span>
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="rounded-2xl border border-white/10 bg-[#161831]/80 p-5 backdrop-blur-md shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Daily Execution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{completedTasksAllTime}</span>
            <span className="text-xs text-slate-400">tasks completed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{
                width: `${
                  totalTasksAllTime === 0 ? 0 : Math.round((completedTasksAllTime / totalTasksAllTime) * 100)
                }%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Consistent daily execution is the #1 predictor of GCE A/L district merit.
          </p>
        </div>
      </div>

      {/* Revision habit stat — additive bonus, separate from syllabus % */}
      <div className="rounded-2xl border border-teal-400/30 bg-teal-500/[0.07] p-5 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-300">🔁 Revision habit (bonus only)</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-white">{revisionCount}</span>
            <span className="text-xs text-slate-300">revision{revisionCount === 1 ? '' : 's'} completed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tracked separately from first-time topic completions — revising never pushes a subject beyond 100% and never penalizes you.
          </p>
        </div>
        <div className="text-[11px] text-teal-200/90 font-semibold shrink-0">
          {revisionCount === 0
            ? 'Mark a topic completed, then add a Revision block to start.'
            : 'Great habit! Revising keeps it fresh 🔁'}
        </div>
      </div>

      {/* Subject-by-Subject Detailed Progress */}
      <div className="rounded-3xl border border-white/10 bg-[#161831]/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Subject-Level Syllabus Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {streamSubjects.map((s) => {
            const sProg = calculateSubjectProgression(s.name, syllabusTopics);
            const sDone = sProg.completedTopics;
            const sActive = sProg.inProgressTopics;
            const sPending = sProg.notStartedTopics;
            const sPercent = sProg.percentage;
            const sSubDone = sProg.completedSubtopics;
            const sSubTotal = sProg.totalSubtopics;

            return (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-sm font-bold text-white line-clamp-1">{s.name}</span>
                  </div>
                  <span className="text-lg font-black text-cyan-300">{sPercent}%</span>
                </div>

                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6B4EFF] to-cyan-400"
                    style={{ width: `${sPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="font-bold text-emerald-400 block">{sDone}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Done</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="font-bold text-amber-400 block">{sActive}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Active</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-500/10 border border-slate-500/20">
                    <span className="font-bold text-slate-300 block">{sPending}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Pending</span>
                  </div>
                </div>

                {sSubTotal > 0 && (
                  <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-white/5">
                    <span className="text-cyan-400 font-semibold">{sSubDone}</span> of {sSubTotal} syllabus subtopics completed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sri Lankan GCE A/L Exam Strategies */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#121636] to-[#0D1022] p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-cyan-300 text-sm font-bold">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>GCE A/L Preparation Strategies</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <span className="font-bold text-white block">1. 50 MCQ Past Paper Timed Sprints</span>
            <p className="text-slate-400 leading-relaxed">
              Complete full 50-question MCQ simulations strictly within 2 hours. Review every incorrect option on the same day.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <span className="font-bold text-white block">2. Structured Essay Keywords</span>
            <p className="text-slate-400 leading-relaxed">
              Memorize the Department of Examinations marking scheme standard keywords for practicals and theory derivations.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <span className="font-bold text-white block">3. 10-Year Trend Analysis</span>
            <p className="text-slate-400 leading-relaxed">
              Ensure all recurring topics from the last 10 years (e.g., Potentiometers, Coplanar Forces, Buffer Solutions) are marked 'Completed'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
