import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DayOfWeek, TimetableEntry, StreamType } from '../../types';
import {
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Layers,
  Link,
} from 'lucide-react';
import { SUBJECT_METAS, getSubjectsForStream } from '../../data/alSyllabusData';
import { INITIAL_TIMETABLE_ENTRIES } from '../../data/alSyllabusData';

interface WeeklyTimetableProps {
  entries: TimetableEntry[];
  stream: StreamType;
  physicalScienceElective?: 'Chemistry' | 'ICT';
  onSelectElective?: (elective: 'Chemistry' | 'ICT') => void;
  onAddEntry: (
    entry: Omit<TimetableEntry, 'id'> & { syncToDailyPlanner?: boolean }
  ) => void;
  onUpdateEntry: (entry: TimetableEntry) => void;
  onDeleteEntry: (id: string) => void;
  onResetTimetable: () => void;
  onToggleEntryCompletion?: (id: string) => void;
  onRequestNotificationPermission?: () => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/40', text: 'text-indigo-300', badge: 'bg-indigo-500' },
  cyan: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/40', text: 'text-cyan-300', badge: 'bg-cyan-500' },
  purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-300', badge: 'bg-purple-500' },
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', badge: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', badge: 'bg-amber-500' },
  rose: { bg: 'bg-rose-500/15', border: 'border-rose-500/40', text: 'text-rose-300', badge: 'bg-rose-500' },
  blue: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-300', badge: 'bg-blue-500' },
  pink: { bg: 'bg-pink-500/15', border: 'border-pink-500/40', text: 'text-pink-300', badge: 'bg-pink-500' },
};

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  entries,
  stream,
  physicalScienceElective = 'Chemistry',
  onSelectElective,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onResetTimetable,
  onToggleEntryCompletion,
  onRequestNotificationPermission,
}) => {
  // Mobile day tab selection (default to current day of week)
  const todayName = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayName);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Available subjects for current stream (Physical: Combined Maths + Physics + Chem/ICT; Bio: Biology + Chem + Physics)
  const availableSubjects = getSubjectsForStream(stream, physicalScienceElective);

  // Form states
  const [formDay, setFormDay] = useState<DayOfWeek>('Monday');
  const [formSubject, setFormSubject] = useState<string>(availableSubjects[0]?.name || 'Combined Mathematics');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('06:00');
  const [formEndTime, setFormEndTime] = useState<string>('08:00');
  const [formColor, setFormColor] = useState<string>(availableSubjects[0]?.color || 'indigo');
  const [formReminderEnabled, setFormReminderEnabled] = useState<boolean>(true);
  const [formReminderOffset, setFormReminderOffset] = useState<0 | 10 | 15 | 30 | 60>(15);
  const [formNotes, setFormNotes] = useState<string>('');
  const [syncToDailyPlanner, setSyncToDailyPlanner] = useState<boolean>(true);

  const openAddModal = (defaultDay?: DayOfWeek) => {
    setEditingEntry(null);
    setFormDay(defaultDay || selectedDay);
    const firstSubj = availableSubjects[0]?.name || 'Combined Mathematics';
    setFormSubject(firstSubj);
    setFormTopic('');
    setFormStartTime('06:00');
    setFormEndTime('08:00');
    setFormColor(availableSubjects[0]?.color || 'indigo');
    setFormReminderEnabled(true);
    setFormReminderOffset(15);
    setFormNotes('');
    setSyncToDailyPlanner(true);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormDay(entry.dayOfWeek);
    setFormSubject(entry.subject);
    setFormTopic(entry.topic);
    setFormStartTime(entry.startTime);
    setFormEndTime(entry.endTime);
    setFormColor(entry.color);
    setFormReminderEnabled(entry.reminderEnabled);
    setFormReminderOffset(entry.reminderOffsetMinutes);
    setFormNotes(entry.notes || '');
    setSyncToDailyPlanner(false);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTopic.trim()) return;

    if (editingEntry) {
      onUpdateEntry({
        ...editingEntry,
        dayOfWeek: formDay,
        subject: formSubject,
        topic: formTopic.trim(),
        startTime: formStartTime,
        endTime: formEndTime,
        color: formColor,
        reminderEnabled: formReminderEnabled,
        reminderOffsetMinutes: formReminderOffset,
        notes: formNotes.trim(),
      });
    } else {
      onAddEntry({
        dayOfWeek: formDay,
        subject: formSubject,
        topic: formTopic.trim(),
        startTime: formStartTime,
        endTime: formEndTime,
        color: formColor,
        reminderEnabled: formReminderEnabled,
        reminderOffsetMinutes: formReminderOffset,
        notes: formNotes.trim(),
        syncToDailyPlanner,
      });
    }

    setIsModalOpen(false);
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (selectedSubjectFilter !== 'all' && entry.subject !== selectedSubjectFilter) {
      return false;
    }
    return true;
  });

  const dayEntries = filteredEntries
    .filter((entry) => entry.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div id="weekly-timetable-view" className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#161831] via-[#12142B] to-[#0F1023] p-4 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Weekly Revision Matrix •{' '}
                {stream === 'Biological Science' || (stream as string) === 'Bio'
                  ? 'Biological Science'
                  : 'Physical Science'}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold">
              <Link className="w-3 h-3 text-cyan-400" />
              <span>Daily Planner Synced</span>
            </div>

            {(stream === 'Physical Science' || (stream as string) === 'Maths') && onSelectElective && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs">
                <span className="text-[10px] text-slate-300 font-semibold">3rd Elective:</span>
                <button
                  type="button"
                  onClick={() => onSelectElective('Chemistry')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    physicalScienceElective === 'Chemistry'
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🧪 Chemistry
                </button>
                <button
                  type="button"
                  onClick={() => onSelectElective('ICT')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    physicalScienceElective === 'ICT'
                      ? 'bg-pink-500/30 text-pink-200 border border-pink-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💻 ICT
                </button>
              </div>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            Weekly Study Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Organize revision blocks, sync directly with your Daily Study Planner, and stay on top of the exam syllabus.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle: Day Card vs 7-Day Grid */}
          <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                viewMode === 'day' ? 'bg-[#6B4EFF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                viewMode === 'week' ? 'bg-[#6B4EFF] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Grid
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            id="btn-add-study-block"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6B4EFF] to-[#8B5CF6] hover:from-[#7C5DFA] hover:to-[#9D74FF] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(107,78,255,0.4)] transition hover:scale-105 active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Block</span>
          </button>

          <button
            onClick={onResetTimetable}
            title="Reset to recommended GCE A/L timetable"
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Day Selector Bar (Optimized for Mobile Touch) */}
      <div className="flex flex-col gap-3">
        {/* Horizontal Swipeable Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const dayCount = entries.filter((e) => e.dayOfWeek === day).length;
            const isToday = day === todayName;

            return (
              <button
                key={day}
                id={`day-tab-${day.toLowerCase()}`}
                onClick={() => {
                  setSelectedDay(day);
                  if (viewMode === 'week') setViewMode('day');
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-[#6B4EFF] border-purple-400 text-white shadow-[0_0_12px_rgba(107,78,255,0.4)]'
                    : 'bg-[#161831]/80 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {dayCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subject Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
          </span>
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer min-h-[36px] ${
              selectedSubjectFilter === 'all'
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            All Subjects
          </button>
          {Array.from(new Set(entries.map((e) => e.subject))).map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubjectFilter(subj)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer min-h-[36px] ${
                selectedSubjectFilter === subj
                  ? 'bg-[#6B4EFF]/30 text-cyan-300 border border-[#6B4EFF]/50'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW MODE 1: DAY VIEW (Default & Mobile Friendly) */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{selectedDay} Routine</span>
                {selectedDay === todayName && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    Today
                  </span>
                )}
              </h2>
              <span className="text-xs text-slate-400">({dayEntries.length} study blocks)</span>
            </div>

            <button
              onClick={() => openAddModal(selectedDay)}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer min-h-[44px] px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block</span>
            </button>
          </div>

          {dayEntries.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#161831]/60 p-10 text-center text-slate-400 backdrop-blur-md">
              <BookOpen className="w-12 h-12 mx-auto text-slate-500 mb-3 opacity-60" />
              <p className="text-base font-semibold text-slate-200">No study blocks scheduled for {selectedDay}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add revision sessions, MCQ sprints, or past paper slots to keep your exam preparation consistent.
              </p>
              <button
                onClick={() => openAddModal(selectedDay)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6B4EFF] hover:bg-[#7C5DFA] text-white text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Block for {selectedDay}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayEntries.map((entry) => {
                const colorConfig = COLOR_MAP[entry.color] || COLOR_MAP.indigo;

                return (
                  <div
                    key={entry.id}
                    className={`rounded-2xl border ${colorConfig.border} bg-gradient-to-br from-[#161831]/90 to-[#0F1023]/90 p-4 sm:p-5 backdrop-blur-md shadow-lg flex flex-col justify-between group hover:border-cyan-400/60 transition-all`}
                  >
                    <div>
                      {/* Top Meta: Time & Subject Color Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {entry.startTime} – {entry.endTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {entry.reminderEnabled ? (
                            <span
                              title={`Reminder active: ${entry.reminderOffsetMinutes}m before`}
                              className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center"
                            >
                              <Bell className="w-3 h-3" />
                            </span>
                          ) : (
                            <span
                              title="No reminder set"
                              className="p-1 rounded-lg bg-white/5 text-slate-500 flex items-center"
                            >
                              <BellOff className="w-3 h-3" />
                            </span>
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colorConfig.bg} ${colorConfig.text} border ${colorConfig.border}`}
                          >
                            {entry.subject}
                          </span>
                        </div>
                      </div>

                      {/* Topic Title */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className={`text-base font-bold transition-colors leading-snug ${entry.isCompleted ? 'text-slate-400 line-through' : 'text-white group-hover:text-cyan-300'}`}>
                          {entry.topic}
                        </h3>
                        {entry.fromTaskId && (
                          <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-400/30">
                            <Link className="w-2.5 h-2.5 text-cyan-300" />
                            Daily Planner
                          </span>
                        )}
                        {entry.subtopic && (
                          <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            <BookOpen className="w-2.5 h-2.5 text-emerald-300" />
                            <span className="line-clamp-1">{entry.subtopic}</span>
                          </span>
                        )}
                      </div>

                      {/* Notes / Plan */}
                      {entry.notes && (
                        <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                          {entry.notes}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        {onToggleEntryCompletion && (
                          <button
                            type="button"
                            onClick={() => onToggleEntryCompletion(entry.id)}
                            className={`px-2 py-1 rounded-lg transition flex items-center gap-1.5 text-[11px] font-bold cursor-pointer ${
                              entry.isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:border-white/20'
                            }`}
                            title={entry.isCompleted ? 'Mark as incomplete' : 'Mark block completed'}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${entry.isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <span>{entry.isCompleted ? 'Done' : 'Mark Done'}</span>
                          </button>
                        )}
                        {entry.reminderEnabled && (
                          <span className="text-[11px] text-emerald-300 font-medium">
                            🔔 {entry.reminderOffsetMinutes === 0 ? 'At time' : `${entry.reminderOffsetMinutes}m before`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Edit study block"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Delete study block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: FULL 7-DAY GRID (Scrollable for Small Screens) */}
      {viewMode === 'week' && (
        <div className="rounded-3xl border border-white/10 bg-[#161831]/80 backdrop-blur-xl p-4 sm:p-6 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Full Weekly Matrix (Monday – Sunday)</span>
            </h3>
            <span className="text-xs text-slate-400">Swipe or scroll horizontally on mobile</span>
          </div>

          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="grid grid-cols-7 gap-3 min-w-[850px]">
              {DAYS_OF_WEEK.map((day) => {
                const dayBlocks = filteredEntries
                  .filter((e) => e.dayOfWeek === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const isToday = day === todayName;

                return (
                  <div
                    key={day}
                    className={`rounded-2xl border p-3 flex flex-col gap-2 min-h-[300px] ${
                      isToday
                        ? 'border-cyan-400/50 bg-cyan-950/20'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {day}
                        {isToday && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                      </span>
                      <button
                        onClick={() => openAddModal(day)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                        title={`Add block to ${day}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {dayBlocks.map((block) => {
                        const colorConfig = COLOR_MAP[block.color] || COLOR_MAP.indigo;
                        return (
                          <div
                            key={block.id}
                            onClick={() => openEditModal(block)}
                            className={`p-2.5 rounded-xl border ${colorConfig.border} ${colorConfig.bg} text-xs cursor-pointer hover:scale-[1.02] transition shadow-sm`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold mb-1">
                              <span>{block.startTime}</span>
                              {block.reminderEnabled && <Bell className="w-2.5 h-2.5 text-emerald-400" />}
                            </div>
                            <span className="font-bold text-white block line-clamp-1">{block.subject}</span>
                            <span className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{block.topic}</span>
                          </div>
                        );
                      })}

                      {dayBlocks.length === 0 && (
                        <div className="h-full flex items-center justify-center text-[11px] text-slate-500 italic py-6">
                          No sessions
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Timetable Entry Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4 pt-6 sm:pt-10 pb-24 sm:pb-12">
            <div
              className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-purple-500/40 bg-[#161831] shadow-2xl text-slate-100 flex flex-col max-h-[calc(100dvh-3.5rem)] sm:max-h-[min(88vh,740px)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pinned Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0 bg-[#161831]">
                <div className="flex items-center gap-2 text-base font-bold text-white">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <span>{editingEntry ? 'Edit Study Block' : 'Add New Study Block'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>

            <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs overscroll-contain">
              {/* Day of Week */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Day of the Week</label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-white font-medium focus:border-cyan-400 focus:outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d} className="bg-[#161831] text-white">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                <select
                  value={formSubject}
                  onChange={(e) => {
                    const newSubj = e.target.value;
                    setFormSubject(newSubj);
                    const matched = SUBJECT_METAS.find((s) => s.name === newSubj);
                    if (matched) {
                      setFormColor(matched.color);
                    }
                  }}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-white font-medium focus:border-cyan-400 focus:outline-none"
                >
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.name} className="bg-[#161831] text-white">
                      {s.icon} {s.name}
                    </option>
                  ))}
                  <option value="General English / Git" className="bg-[#161831] text-white">
                    📖 General English / GIT
                  </option>
                  <option value="Self Study & Revision" className="bg-[#161831] text-white">
                    ⚡ Self Study & Revision
                  </option>
                </select>
              </div>

              {/* Topic & Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Topic or Target Practice <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 03: Oscillations & Waves (50 Past Paper MCQs)"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-white placeholder-slate-500 font-medium focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Times: Start and End */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white font-medium focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white font-medium focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Coding */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Color Code by Subject</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.keys(COLOR_MAP).map((colKey) => (
                    <button
                      key={colKey}
                      type="button"
                      onClick={() => setFormColor(colKey)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${COLOR_MAP[colKey].badge} ${
                        formColor === colKey ? 'ring-4 ring-cyan-400 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Reminders Setup */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-white">Browser Study Reminder</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formReminderEnabled}
                    onChange={(e) => setFormReminderEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#6B4EFF] cursor-pointer"
                  />
                </div>

                {formReminderEnabled && (
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/5">
                    <span>Remind Me:</span>
                    <select
                      value={formReminderOffset}
                      onChange={(e) => setFormReminderOffset(Number(e.target.value) as 0 | 10 | 15 | 30 | 60)}
                      className="rounded-lg bg-black/40 border border-white/15 px-2.5 py-1 text-white text-xs font-semibold focus:outline-none"
                    >
                      <option value={0}>At scheduled time</option>
                      <option value={10}>10 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Study Notes or Target Past Paper</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on rotational energy formula derivations and solve question 04 of 2021 exam."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/15 p-2.5 text-white placeholder-slate-500 font-medium focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Bi-directional Sync to Daily Planner Checkbox */}
              {!editingEntry && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="sync-daily-planner-check"
                    checked={syncToDailyPlanner}
                    onChange={(e) => setSyncToDailyPlanner(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-cyan-400 bg-white/10 text-cyan-400 focus:ring-cyan-400 cursor-pointer"
                  />
                  <label htmlFor="sync-daily-planner-check" className="text-xs cursor-pointer">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5" />
                      Sync with Daily Study Planner ({formDay})
                    </span>
                    <span className="text-slate-400 text-[11px] block mt-0.5 leading-relaxed">
                      Automatically schedules a study task on <strong>{formDay} ({formStartTime} - {formEndTime})</strong> in your Daily Study Planner.
                    </span>
                  </label>
                </div>
              )}

              </div>

              {/* Submit / Cancel Buttons in Pinned Sticky Footer */}
              <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#14162e]/95 backdrop-blur-md flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 text-slate-300 font-semibold transition cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6B4EFF] to-[#8B5CF6] hover:from-[#7C5DFA] hover:to-[#9D74FF] text-white font-bold transition shadow-lg cursor-pointer min-h-[44px]"
                >
                  {editingEntry ? 'Update Block' : 'Save & Sync to Daily Planner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
      )}
    </div>
  );
};
