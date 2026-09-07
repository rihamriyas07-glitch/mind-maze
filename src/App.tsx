import React, { useState, useEffect } from 'react';
import { DailyTask, ScreenId, StreamType, SyllabusTopic, TimetableEntry, UserSettings, TopicStatus, StreakData } from './types';
import {
  getStoredTimetable,
  saveStoredTimetable,
  getStoredDailyTasks,
  saveStoredDailyTasks,
  getStoredSyllabusTopics,
  saveStoredSyllabusTopics,
  getUserSettings,
  saveUserSettings,
  getTodayDateString,
  getTodayDayOfWeek,
  getDayOfWeekFromDate,
  getDateForDayOfWeekInCurrentWeek,
  calculateMinutesBetween,
  computeEndTime,
  getSubjectColorKey,
} from './lib/storage';
import {
  getNotificationPermissionStatus,
  registerServiceWorker,
  checkTimetableReminders,
  sendStudyNotification,
  playStudyChime,
} from './lib/notificationService';
import {
  calculateStreak,
  recordTaskCompletionAndRefreshStreak,
  recordAppActivity,
  checkAndSendPeriodicNudge,
} from './lib/streakService';
import {
  generateSmartStudyReminder,
  generateCompletionCelebration,
} from './lib/notificationMessages';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Navbar } from './components/Navbar';
import { MobileBottomBar } from './components/MobileBottomBar';
import { MazeBackground } from './components/MazeBackground';
import { IOSInstallBanner } from './components/IOSInstallBanner';
import { NotificationPermissionModal } from './components/notifications/NotificationPermissionModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { WeeklyTimetable } from './components/timetable/WeeklyTimetable';
import { DailyStudyPlanner } from './components/daily/DailyStudyPlanner';
import { TopicTracker } from './components/topics/TopicTracker';
import { ProgressAnalytics } from './components/progress/ProgressAnalytics';
import {
  INITIAL_TIMETABLE_ENTRIES,
  INITIAL_SYLLABUS_TOPICS,
  getInitialTimetableForStream,
} from './data/alSyllabusData';
import {
  updateSyllabusFromBlockCompletion,
  toggleSubtopicInTopic,
} from './lib/syllabusProgression';
import { WifiOff, Volume2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(() => getStoredTimetable());
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => getStoredDailyTasks());
  const [syllabusTopics, setSyllabusTopics] = useState<SyllabusTopic[]>(() => getStoredSyllabusTopics());
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings());
  const [streakData, setStreakData] = useState<StreakData>(() => calculateStreak(getStoredDailyTasks()));

  // Notification status
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermissionStatus()
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [activeToastReminder, setActiveToastReminder] = useState<string | null>(null);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const isOnline = useOnlineStatus();

  // Track user app interactions to prevent unsolicited nudges during active study
  useEffect(() => {
    recordAppActivity();
    const handleActivity = () => recordAppActivity();
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Auto-dismiss sync toast after 3.5s
  useEffect(() => {
    if (!syncToastMessage) return;
    const timer = setTimeout(() => {
      setSyncToastMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [syncToastMessage]);

  // On initial mount: register service worker & auto-seed today's tasks from timetable if empty
  useEffect(() => {
    registerServiceWorker();

    const todayStr = getTodayDateString();
    const todayDayOfWeek = getTodayDayOfWeek();
    const existingTodayTasks = dailyTasks.filter((t) => t.date === todayStr);

    if (existingTodayTasks.length === 0) {
      // Auto-import today's timetable sessions
      const todayBlocks = timetableEntries.filter((e) => e.dayOfWeek === todayDayOfWeek);
      if (todayBlocks.length > 0) {
        const seeded: DailyTask[] = todayBlocks.map((b, idx) => ({
          id: `task-auto-${todayStr}-${idx}-${Date.now()}`,
          date: todayStr,
          title: `${b.topic} (${b.startTime} - ${b.endTime})`,
          subject: b.subject,
          isCompleted: false,
          estimatedMinutes: 90,
          priority: 'High',
        }));
        const updated = [...dailyTasks, ...seeded];
        setDailyTasks(updated);
        saveStoredDailyTasks(updated);
        setStreakData(calculateStreak(updated));
      }
    }
  }, []);

  // Periodic reminder checker every 30 seconds (checks timetable slot alerts + gentle periodic nudges)
  useEffect(() => {
    const interval = setInterval(() => {
      const todayDay = getTodayDayOfWeek();

      // 1. Timetable Slot Alert with Smart Contextual Motivation
      checkTimetableReminders(timetableEntries, todayDay, {
        dailyTasks,
        currentStreak: streakData.currentStreak,
        onReminderTriggered: (_entry, msg) => {
          setActiveToastReminder(msg);
          setTimeout(() => setActiveToastReminder(null), 8000);
        },
      });

      // 2. Periodic Gentle Nudge Reminders (not spammy, only if incomplete tasks exist, not after 10 PM)
      const nudgeRes = checkAndSendPeriodicNudge(dailyTasks, streakData.currentStreak);
      if (nudgeRes.sent && nudgeRes.message) {
        setActiveToastReminder(nudgeRes.message);
        setTimeout(() => setActiveToastReminder(null), 8000);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [timetableEntries, dailyTasks, streakData.currentStreak]);

  // Manual Test Triggers for Review & Instant Verification
  const handleTestSmartReminder = () => {
    const todayStr = getTodayDateString();
    const todayTasks = dailyTasks.filter((t) => t.date === todayStr);
    const incompleteTasks = todayTasks.filter((t) => !t.isCompleted);
    const targetTask = incompleteTasks[0] || todayTasks[0];

    const smartMsg = generateSmartStudyReminder({
      subject: targetTask?.subject || (settings.stream === 'Biological Science' ? 'Biology' : 'Combined Mathematics'),
      topicTitle: targetTask?.topicTitle || targetTask?.title || "Newton's Laws & Momentum",
      subtopic: targetTask?.subtopic,
      timeContext: 'Starting in 15 minutes',
      currentStreak: streakData.currentStreak,
      totalTodayTasks: todayTasks.length > 0 ? todayTasks.length : 3,
      completedTodayTasks: todayTasks.filter((t) => t.isCompleted).length,
      remainingTodayTasks: incompleteTasks.length > 0 ? incompleteTasks.length : 1,
      currentHour: new Date().getHours(),
    });

    sendStudyNotification(smartMsg.title, smartMsg.body, '/icon.svg', 'mind-maze-smart-test');
    setActiveToastReminder(`${smartMsg.title}: ${smartMsg.body}`);
    setTimeout(() => setActiveToastReminder(null), 8000);
  };

  const handleTestNudge = () => {
    const res = checkAndSendPeriodicNudge(dailyTasks, streakData.currentStreak, true);
    if (res.message) {
      setActiveToastReminder(res.message);
      setTimeout(() => setActiveToastReminder(null), 8000);
    }
  };

  // Timetable Handlers with Bi-directional Sync
  const handleAddTimetableEntry = (
    newEntry: Omit<TimetableEntry, 'id'> & { syncToDailyPlanner?: boolean }
  ) => {
    const timetableId = `tt-${Date.now()}`;
    const { syncToDailyPlanner = true, ...entryData } = newEntry;

    // Determine corresponding calendar date for this day of week in current week
    const correspondingDate = getDateForDayOfWeekInCurrentWeek(newEntry.dayOfWeek);
    const taskId = `task-from-${timetableId}`;

    const entryWithId: TimetableEntry = {
      ...entryData,
      id: timetableId,
      fromTaskId: syncToDailyPlanner ? taskId : undefined,
    };

    const updatedTimetable = [...timetableEntries, entryWithId];
    setTimetableEntries(updatedTimetable);
    saveStoredTimetable(updatedTimetable);

    // If sync enabled, automatically create a linked task in the Daily Study Planner
    if (syncToDailyPlanner) {
      const estMinutes = calculateMinutesBetween(newEntry.startTime, newEntry.endTime);
      const newTask: DailyTask = {
        id: taskId,
        date: correspondingDate,
        title: newEntry.topic,
        subject: newEntry.subject,
        isCompleted: false,
        estimatedMinutes: estMinutes,
        priority: 'High',
        timeSlot: `${newEntry.startTime} - ${newEntry.endTime}`,
        startTime: newEntry.startTime,
        endTime: newEntry.endTime,
        fromTimetableId: timetableId,
      };

      const updatedTasks = [newTask, ...dailyTasks];
      setDailyTasks(updatedTasks);
      saveStoredDailyTasks(updatedTasks);

      setSyncToastMessage(
        `🔗 Timetable slot added and synced to Daily Planner for ${newEntry.dayOfWeek} (${newEntry.startTime} - ${newEntry.endTime})`
      );
    }
  };

  const handleUpdateTimetableEntry = (updatedEntry: TimetableEntry) => {
    const updated = timetableEntries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
    setTimetableEntries(updated);
    saveStoredTimetable(updated);

    // If there is an associated linked task in the Daily Planner, update it in sync
    const hasLinkedTask = dailyTasks.some(
      (t) => t.fromTimetableId === updatedEntry.id || (updatedEntry.fromTaskId && t.id === updatedEntry.fromTaskId)
    );

    if (hasLinkedTask) {
      const estMinutes = calculateMinutesBetween(updatedEntry.startTime, updatedEntry.endTime);
      const newDate = getDateForDayOfWeekInCurrentWeek(updatedEntry.dayOfWeek);
      const updatedTasks = dailyTasks.map((t) => {
        if (t.fromTimetableId === updatedEntry.id || (updatedEntry.fromTaskId && t.id === updatedEntry.fromTaskId)) {
          return {
            ...t,
            date: newDate,
            title: updatedEntry.topic,
            subject: updatedEntry.subject,
            timeSlot: `${updatedEntry.startTime} - ${updatedEntry.endTime}`,
            startTime: updatedEntry.startTime,
            endTime: updatedEntry.endTime,
            estimatedMinutes: estMinutes,
          };
        }
        return t;
      });
      setDailyTasks(updatedTasks);
      saveStoredDailyTasks(updatedTasks);
      setSyncToastMessage(`🔗 Updated linked task in Daily Planner for ${updatedEntry.dayOfWeek}`);
    }
  };

  const handleDeleteTimetableEntry = (id: string) => {
    const entryToDelete = timetableEntries.find((e) => e.id === id);
    const updated = timetableEntries.filter((e) => e.id !== id);
    setTimetableEntries(updated);
    saveStoredTimetable(updated);

    // Remove any linked daily planner task created from this timetable slot
    if (entryToDelete) {
      const updatedTasks = dailyTasks.filter(
        (t) => t.fromTimetableId !== id && (!entryToDelete.fromTaskId || t.id !== entryToDelete.fromTaskId)
      );
      if (updatedTasks.length !== dailyTasks.length) {
        setDailyTasks(updatedTasks);
        saveStoredDailyTasks(updatedTasks);
        setSyncToastMessage(`🔗 Removed linked task from Daily Planner`);
      }
    }
  };

  const handleResetTimetable = () => {
    if (window.confirm('Reset your timetable to recommended GCE A/L revision schedule for your stream?')) {
      const fresh = getInitialTimetableForStream(settings.stream, settings.physicalScienceElective);
      setTimetableEntries(fresh);
      saveStoredTimetable(fresh);
    }
  };

  const handleToggleTimetableEntryCompletion = (entryId: string) => {
    const entry = timetableEntries.find((e) => e.id === entryId);
    if (!entry) return;
    const willBeCompleted = !entry.isCompleted;

    const updated = timetableEntries.map((e) =>
      e.id === entryId ? { ...e, isCompleted: willBeCompleted } : e
    );
    setTimetableEntries(updated);
    saveStoredTimetable(updated);

    // Sync syllabus progress if entry has topic or subtopic
    const syncRes = updateSyllabusFromBlockCompletion(syllabusTopics, {
      topicId: entry.topicId,
      topicTitle: entry.topic,
      subtopic: entry.subtopic,
      subject: entry.subject,
      isCompleted: willBeCompleted,
    });

    if (syncRes.changeMessage) {
      setSyllabusTopics(syncRes.updatedTopics);
      saveStoredSyllabusTopics(syncRes.updatedTopics);
      setSyncToastMessage(`📚 ${syncRes.changeMessage}`);
    }
  };

  // Daily Tasks Handlers with Bi-directional Sync
  const handleToggleTask = (taskId: string) => {
    const targetTask = dailyTasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const willBeCompleted = !targetTask.isCompleted;

    const updated = dailyTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            isCompleted: willBeCompleted,
            completedAt: willBeCompleted ? new Date().toISOString() : undefined,
          }
        : t
    );
    setDailyTasks(updated);
    saveStoredDailyTasks(updated);

    // Check today completion status before and after toggle
    const todayStr = getTodayDateString();
    const prevTodayTasks = dailyTasks.filter((t) => t.date === todayStr);
    const newTodayTasks = updated.filter((t) => t.date === todayStr);

    const wasAllDoneBefore = prevTodayTasks.length > 0 && prevTodayTasks.every((t) => t.isCompleted);
    const isAllDoneNow = newTodayTasks.length > 0 && newTodayTasks.every((t) => t.isCompleted);

    // Refresh and persist streak
    const newStreak = recordTaskCompletionAndRefreshStreak(updated, willBeCompleted && targetTask.date === todayStr);
    setStreakData(newStreak);

    // If student just completed all of today's topics: send a congratulatory notification!
    if (!wasAllDoneBefore && isAllDoneNow && willBeCompleted) {
      const congrats = generateCompletionCelebration({
        currentStreak: newStreak.currentStreak,
        totalCompletedCount: newTodayTasks.length,
      });
      sendStudyNotification(congrats.title, congrats.body, '/icon.svg', 'mind-maze-completion');
      setActiveToastReminder(`${congrats.title} ${congrats.body}`);
      setTimeout(() => setActiveToastReminder(null), 9000);
    }

    // Bi-directionally update syllabus progress if this task corresponds to a syllabus topic or subtopic
    const syncRes = updateSyllabusFromBlockCompletion(syllabusTopics, {
      topicId: targetTask.topicId,
      topicTitle: targetTask.topicTitle || targetTask.title,
      subtopic: targetTask.subtopic,
      subject: targetTask.subject,
      isCompleted: willBeCompleted,
    });

    if (syncRes.changeMessage) {
      setSyllabusTopics(syncRes.updatedTopics);
      saveStoredSyllabusTopics(syncRes.updatedTopics);
      setSyncToastMessage(`📚 ${syncRes.changeMessage}`);
    }
  };

  const handleAddDailyTask = (
    newTask: Omit<DailyTask, 'id'> & {
      syncToTimetable?: boolean;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    const taskId = `task-${Date.now()}`;
    const { syncToTimetable = true, ...taskData } = newTask;

    const dayOfWeek = getDayOfWeekFromDate(newTask.date);
    const timetableId = `tt-from-${taskId}`;

    const taskWithId: DailyTask = {
      ...taskData,
      id: taskId,
      fromTimetableId: syncToTimetable ? timetableId : undefined,
    };

    const updatedTasks = [taskWithId, ...dailyTasks];
    setDailyTasks(updatedTasks);
    saveStoredDailyTasks(updatedTasks);

    // If sync enabled, automatically create a linked study slot in Weekly Timetable
    if (syncToTimetable) {
      const startTime = newTask.startTime || '16:00';
      const endTime = newTask.endTime || computeEndTime(startTime, newTask.estimatedMinutes || 60);
      const colorKey = getSubjectColorKey(newTask.subject);

      const newTimetableEntry: TimetableEntry = {
        id: timetableId,
        dayOfWeek,
        subject: newTask.subject,
        topic: newTask.title,
        startTime,
        endTime,
        color: colorKey,
        reminderEnabled: true,
        reminderOffsetMinutes: 15,
        fromTaskId: taskId,
        notes: `Scheduled from Daily Planner (${newTask.date})`,
      };

      const updatedTimetable = [...timetableEntries, newTimetableEntry];
      setTimetableEntries(updatedTimetable);
      saveStoredTimetable(updatedTimetable);

      setSyncToastMessage(
        `🔗 Daily task saved and synced to Weekly Timetable on ${dayOfWeek} (${startTime} - ${endTime})`
      );
    }
  };

  const handleDeleteDailyTask = (taskId: string) => {
    const taskToDelete = dailyTasks.find((t) => t.id === taskId);
    const updatedTasks = dailyTasks.filter((t) => t.id !== taskId);
    setDailyTasks(updatedTasks);
    saveStoredDailyTasks(updatedTasks);

    // If this daily task had a corresponding timetable entry, remove it
    if (taskToDelete && taskToDelete.fromTimetableId) {
      const updatedTimetable = timetableEntries.filter(
        (e) => e.id !== taskToDelete.fromTimetableId && (!e.fromTaskId || e.fromTaskId !== taskId)
      );
      if (updatedTimetable.length !== timetableEntries.length) {
        setTimetableEntries(updatedTimetable);
        saveStoredTimetable(updatedTimetable);
        setSyncToastMessage(`🔗 Removed linked slot from Weekly Timetable`);
      }
    }
  };

  const handleSyncFromTimetable = (dateStr: string) => {
    const targetDay = getDayOfWeekFromDate(dateStr);
    const dayBlocks = timetableEntries.filter((e) => e.dayOfWeek === targetDay);
    if (dayBlocks.length === 0) {
      setSyncToastMessage(`ℹ️ No timetable entries found for ${targetDay}. You can add some in the Timetable tab.`);
      return;
    }

    const currentForDate = dailyTasks.filter((t) => t.date === dateStr);
    const newTasks: DailyTask[] = dayBlocks
      .filter(
        (b) =>
          !currentForDate.some(
            (ct) => ct.fromTimetableId === b.id || ct.title.startsWith(b.topic)
          )
      )
      .map((b, idx) => ({
        id: `task-sync-${dateStr}-${idx}-${Date.now()}`,
        date: dateStr,
        title: b.topic,
        subject: b.subject,
        isCompleted: false,
        estimatedMinutes: calculateMinutesBetween(b.startTime, b.endTime),
        priority: 'High',
        timeSlot: `${b.startTime} - ${b.endTime}`,
        startTime: b.startTime,
        endTime: b.endTime,
        fromTimetableId: b.id,
      }));

    if (newTasks.length === 0) {
      setSyncToastMessage(`ℹ️ All scheduled timetable slots for ${targetDay} are already in your daily list.`);
      return;
    }

    const updated = [...newTasks, ...dailyTasks];
    setDailyTasks(updated);
    saveStoredDailyTasks(updated);
    setSyncToastMessage(`🔗 Imported ${newTasks.length} study block(s) from ${targetDay} Timetable into Daily Planner!`);
  };

  // Syllabus Topics Handlers
  const handleUpdateTopicStatus = (topicId: string, status: TopicStatus) => {
    const updated = syllabusTopics.map((t) => {
      if (t.id !== topicId) return t;
      // If marking completed directly, mark all subtopics completed
      const allSubtopics = t.subtopics || [];
      return {
        ...t,
        status,
        completedSubtopics: status === 'completed' ? [...allSubtopics] : (status === 'not_started' ? [] : t.completedSubtopics),
      };
    });
    setSyllabusTopics(updated);
    saveStoredSyllabusTopics(updated);
  };

  const handleToggleSubtopic = (topicId: string, subtopicTitle: string) => {
    const updated = toggleSubtopicInTopic(syllabusTopics, topicId, subtopicTitle);
    setSyllabusTopics(updated);
    saveStoredSyllabusTopics(updated);
  };

  const handleAddCustomTopic = (newTopic: Omit<SyllabusTopic, 'id'>) => {
    const topicWithId: SyllabusTopic = {
      ...newTopic,
      id: `topic-custom-${Date.now()}`,
    };
    const updated = [...syllabusTopics, topicWithId];
    setSyllabusTopics(updated);
    saveStoredSyllabusTopics(updated);
  };

  // Settings Handlers
  const handleSelectStream = (newStream: StreamType) => {
    const updated = saveUserSettings({ stream: newStream });
    setSettings(updated);
  };

  const handleSelectElective = (newElective: 'Chemistry' | 'ICT') => {
    const updated = saveUserSettings({ physicalScienceElective: newElective });
    setSettings(updated);
  };

  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    const updated = saveUserSettings(partial);
    setSettings(updated);
  };

  // Navigation
  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Today pending count for bottom nav badge
  const todayDate = getTodayDateString();
  const pendingCount = dailyTasks.filter((t) => t.date === todayDate && !t.isCompleted).length;

  return (
    <div className="relative min-h-screen bg-[#0F1023] bg-[radial-gradient(circle_at_top_right,_#1a1b3d_0%,_#0F1023_100%)] text-slate-100 flex flex-col selection:bg-[#6B4EFF] selection:text-white font-['Poppins',sans-serif]">
      {/* Visual Ambient Maze Grid */}
      <MazeBackground opacity={0.25} />

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-amber-600/90 text-white text-xs py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2 backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are offline. Mind Maze PWA is saving your study progress locally!</span>
        </div>
      )}

      {/* Active study reminder toast pop-up */}
      {activeToastReminder && (
        <div className="fixed top-20 right-4 z-50 max-w-sm rounded-2xl border border-cyan-400/50 bg-[#161831]/95 p-4 shadow-2xl backdrop-blur-xl animate-bounce flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-cyan-300 uppercase block">Study Time Reminder</span>
            <p className="text-xs font-semibold text-white mt-0.5">{activeToastReminder}</p>
          </div>
          <button
            onClick={() => setActiveToastReminder(null)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bi-directional Sync Notification Toast */}
      {syncToastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md rounded-2xl border border-cyan-400/60 bg-[#161831]/95 p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-fadeIn">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <LinkIcon className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">Timetable & Planner Synced</span>
            <p className="text-xs font-medium text-slate-200 mt-0.5 leading-relaxed">{syncToastMessage}</p>
          </div>
          <button
            onClick={() => setSyncToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs p-1 rounded hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        stream={settings.stream}
        onSelectStream={handleSelectStream}
        physicalScienceElective={settings.physicalScienceElective}
        onSelectElective={handleSelectElective}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={() => setIsNotificationModalOpen(true)}
        currentStreak={streakData.currentStreak}
      />

      {/* Main Content View Container */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-12">
        {currentScreen === 'dashboard' && (
          <DashboardOverview
            stream={settings.stream}
            physicalScienceElective={settings.physicalScienceElective}
            onSelectElective={handleSelectElective}
            timetableEntries={timetableEntries}
            dailyTasks={dailyTasks}
            syllabusTopics={syllabusTopics}
            streakData={streakData}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={() => setIsNotificationModalOpen(true)}
            onTestSmartReminder={handleTestSmartReminder}
            onTestNudge={handleTestNudge}
            onNavigate={handleNavigate}
            onToggleTask={handleToggleTask}
          />
        )}

        {currentScreen === 'timetable' && (
          <WeeklyTimetable
            entries={timetableEntries}
            stream={settings.stream}
            physicalScienceElective={settings.physicalScienceElective}
            onSelectElective={handleSelectElective}
            onAddEntry={handleAddTimetableEntry}
            onUpdateEntry={handleUpdateTimetableEntry}
            onDeleteEntry={handleDeleteTimetableEntry}
            onResetTimetable={handleResetTimetable}
            onToggleEntryCompletion={handleToggleTimetableEntryCompletion}
            onRequestNotificationPermission={() => setIsNotificationModalOpen(true)}
          />
        )}

        {currentScreen === 'daily' && (
          <DailyStudyPlanner
            tasks={dailyTasks}
            timetableEntries={timetableEntries}
            syllabusTopics={syllabusTopics}
            stream={settings.stream}
            physicalScienceElective={settings.physicalScienceElective}
            onSelectElective={handleSelectElective}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddDailyTask}
            onDeleteTask={handleDeleteDailyTask}
            onSyncFromTimetable={handleSyncFromTimetable}
          />
        )}

        {currentScreen === 'topics' && (
          <TopicTracker
            topics={syllabusTopics}
            stream={settings.stream}
            physicalScienceElective={settings.physicalScienceElective}
            onSelectElective={handleSelectElective}
            onUpdateTopicStatus={handleUpdateTopicStatus}
            onToggleSubtopic={handleToggleSubtopic}
            onAddCustomTopic={handleAddCustomTopic}
            onNavigateToDailyPlanner={() => handleNavigate('daily')}
          />
        )}

        {currentScreen === 'progress' && (
          <ProgressAnalytics
            stream={settings.stream}
            syllabusTopics={syllabusTopics}
            timetableEntries={timetableEntries}
            dailyTasks={dailyTasks}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Thumb-Reachable Smartphone Bottom Navigation Bar */}
      <MobileBottomBar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        pendingDailyTasksCount={pendingCount}
      />

      {/* Notification Permission Explanation & Consent Modal */}
      <NotificationPermissionModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onPermissionUpdated={(perm) => {
          setNotificationPermission(perm);
          handleUpdateSettings({
            notificationsGranted: perm === 'granted',
            hasSeenNotificationPrompt: true,
          });
        }}
      />

      {/* iOS Safari PWA Install Banner */}
      <IOSInstallBanner />
    </div>
  );
}
