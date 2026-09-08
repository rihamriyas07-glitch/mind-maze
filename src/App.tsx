import { useState, useEffect, useRef } from 'react';
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
  maybeSendDailyCountdown,
  sendStudyNotification,
  playStudyChime,
} from './lib/notificationService';
import {
  calculateStreak,
  clearStoredStreak,
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
  getInitialTimetableForStream,
  INITIAL_SYLLABUS_TOPICS,
} from './data/alSyllabusData';
import {
  updateSyllabusFromBlockCompletion,
  toggleSubtopicInTopic,
  markTopicsCompleted,
  calculateSubjectProgression,
} from './lib/syllabusProgression';
import {
  getRevisionStats,
  recordRevisionCompletion,
  undoRevisionCompletion,
  saveRevisionStats,
  normalizeBlockType,
  RevisionStats,
} from './lib/revisionService';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import {
  fetchUserProfile,
  loadCloudData,
  pushTimetable,
  pushTasks,
  pushTopics,
  pushStreak,
  createProfile,
  updateProfileStream,
  updateProfileElective,
  updateProfileExamDate,
  updateProfileGoals,
  fetchRevisionCount,
  updateProfileRevisionCount,
  toElective,
  toExamDate,
  PhysicalElective,
  UserRole,
  CloudError,
} from './lib/cloudStore';
import { SupabaseAuth, AuthView } from './components/auth/SupabaseAuth';
import { EmailConfirmed } from './components/auth/EmailConfirmed';
import { AdminPanel } from './components/admin/AdminPanel';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { CelebrationModal, Celebration } from './components/common/CelebrationModal';
import { LandingPage } from './components/screens/LandingPage';
import { WifiOff, Volume2, Link as LinkIcon, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

// ---- URL routing (no router dependency; history API + popstate) ----
// Public:   "/" (landing for signed-out visitors), "/login", "/signup"
// Protected (require a session when Supabase is configured):
//   "/dashboard", "/timetable", "/daily", "/topics", "/progress", "/admin", "/settings"
const SCREEN_PATHS: Record<ScreenId, string> = {
  dashboard: '/dashboard',
  timetable: '/timetable',
  daily: '/daily',
  topics: '/topics',
  progress: '/progress',
  admin: '/admin',
  settings: '/settings',
};

function screenForPath(pathname: string): ScreenId | null {
  switch (pathname) {
    case '/dashboard':
      return 'dashboard';
    case '/timetable':
      return 'timetable';
    case '/daily':
      return 'daily';
    case '/topics':
      return 'topics';
    case '/progress':
      return 'progress';
    case '/admin':
      return 'admin';
    case '/settings':
      return 'settings';
    default:
      return null;
  }
}

function authViewForPath(pathname: string): AuthView | null {
  if (pathname === '/login') return 'signin';
  if (pathname === '/signup') return 'signup';
  return null;
}

function navigateTo(path: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function App() {
  // Hooks must stay unconditional and in a stable order at the top of the
  // component (Rules of Hooks). useOnlineStatus is first so its dispatcher
  // slot never shifts when later state/effects change.
  const isOnline = useOnlineStatus();

  const [routePath, setRoutePath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() =>
    (typeof window !== 'undefined' ? screenForPath(window.location.pathname) : null) ?? 'dashboard'
  );
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>(() => getStoredTimetable());
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => getStoredDailyTasks());
  const [syllabusTopics, setSyllabusTopics] = useState<SyllabusTopic[]>(() => getStoredSyllabusTopics());
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings());
  const [streakData, setStreakData] = useState<StreakData>(() => calculateStreak(getStoredDailyTasks()));
  const [revisionStats, setRevisionStats] = useState<RevisionStats>(() => getRevisionStats());

  // ---- Supabase Auth + Cloud Sync state ----
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  // Access role resolved from profiles.role for the signed-in user.
  // Defaults to 'student'; only set to 'admin' from the Supabase row.
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [authView, setAuthView] = useState<AuthView>(() =>
    (typeof window !== 'undefined' ? authViewForPath(window.location.pathname) : null) ?? 'signin'
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudSyncOn, setCloudSyncOn] = useState(false);
  // signupStream carries landing-page stream taps into the signup form
  // (pre-selects the picker there).
  const [signupStream, setSignupStream] = useState<'Physical Science' | 'Biological Science' | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  const loadedUidRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  // Notification status
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermissionStatus()
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [activeToastReminder, setActiveToastReminder] = useState<string | null>(null);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Celebration queue: day-complete / subject-complete / streak-milestone
  // modals. Only the first shows; closing it reveals the next (max 3 queued).
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const pushCelebration = (c: Omit<Celebration, 'id'>) => {
    setCelebrations((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, { ...c, id: `${c.kind}-${Date.now()}-${prev.length}` }];
    });
  };
  const dismissCelebration = () => {
    setCelebrations((prev) => prev.slice(1));
  };

  /** True when the subject just crossed to 100% syllabus coverage. */
  const didSubjectJustComplete = (
    before: SyllabusTopic[],
    after: SyllabusTopic[],
    subject: string
  ): boolean => {
    if (!subject) return false;
    try {
      return (
        calculateSubjectProgression(subject, before).percentage < 100 &&
        calculateSubjectProgression(subject, after).percentage >= 100
      );
    } catch {
      return false;
    }
  };

  /** Streak thresholds that earn a milestone celebration when crossed. */
  const STREAK_MILESTONES = [7, 14, 30, 60, 100, 200, 365];
  const crossedMilestone = (prevStreak: number, newStreak: number): number | null => {
    for (const m of STREAK_MILESTONES) {
      if (prevStreak < m && newStreak >= m) return m;
    }
    return null;
  };

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

  // Keep URL route, auth view, and in-app screen in sync (back/forward buttons).
  useEffect(() => {
    const syncRoute = () => {
      const p = window.location.pathname;
      setRoutePath(p);
      const av = authViewForPath(p);
      if (av) setAuthView(av);
      const s = screenForPath(p);
      if (s) setCurrentScreen(s);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  // Route guards (session is the ONLY thing that grants app access):
  // - Signed-in visitor on "/", "/login" or "/signup" -> redirect to /dashboard.
  // - Signed-out visitor on a protected route (e.g. /dashboard) -> /login.
  // - Signed-out visitor on "/" stays on the public landing page.
  // There is intentionally no "local-only bypass": without a valid session
  // the Dashboard is never rendered, so demo/default data can never leak
  // to a signed-out visitor.
  useEffect(() => {
    if (!authChecked || cloudLoading) return;
    const signedInReady = !!authUserId && !!username;
    if (signedInReady) {
      if (routePath === '/' || routePath === '/login' || routePath === '/signup') {
        navigateTo(SCREEN_PATHS[currentScreen]);
      }
      return;
    }
    if (!authUserId && screenForPath(routePath)) {
      navigateTo('/login');
    }
  }, [authChecked, cloudLoading, authUserId, username, routePath, currentScreen]);

  // On initial mount: register service worker only.
  // NOTE: no auto-seeding — fresh accounts must start with 0 timetable
  // blocks and 0 daily tasks. Students add blocks explicitly or via the
  // "Sync from timetable" button in the Daily Planner.
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // ---- Supabase session handling + cloud load/merge ----
  const loadCloudForUser = async (userId: string) => {
    if (loadingRef.current || loadedUidRef.current === userId) return;
    loadingRef.current = true;
    setCloudLoading(true);
    setCloudError(null);
    try {
      // 1. Ensure the student has a username profile row.
      const profile = await fetchUserProfile(userId);
      let name = profile.username;
      let profileStream: string | null = profile.stream;
      let profileElective = toElective(profile.elective);
      let profileExamDate = toExamDate(profile.alExamDate);
      let profileZScore = profile.targetZScore?.trim() || null;
      let profileNote = profile.motivationNote?.trim() || null;
      // Pending sign-up extras (email-confirm flow: no session at sign-up).
      let pendingTopicIds: string[] = [];
      if (!name) {
        // First login after email verification: claim the pending username
        // (plus stream + elective + exam date + completed topics chosen at
        // sign-up on this device, if present).
        let pending: string | null = null;
        let pendingStream: string | null = null;
        let pendingElective: PhysicalElective | null = null;
        let pendingExamDate: string | null = null;
        let pendingZScore: string | null = null;
        let pendingNote: string | null = null;
        try {
          pending = localStorage.getItem('mindmaze_pending_username');
          pendingStream = localStorage.getItem('mindmaze_pending_stream');
          pendingElective = toElective(localStorage.getItem('mindmaze_pending_elective'));
          pendingExamDate = toExamDate(localStorage.getItem('mindmaze_pending_exam_date'));
          pendingZScore = localStorage.getItem('mindmaze_pending_zscore')?.trim() || null;
          pendingNote = localStorage.getItem('mindmaze_pending_note')?.trim() || null;
          try {
            const rawTopics = localStorage.getItem('mindmaze_pending_topics');
            const parsed = rawTopics ? JSON.parse(rawTopics) : [];
            if (Array.isArray(parsed)) {
              pendingTopicIds = parsed.filter((id): id is string => typeof id === 'string');
            }
          } catch {}
        } catch {}
        if (
          pendingStream !== 'Physical Science' &&
          pendingStream !== 'Biological Science'
        ) {
          pendingStream = null;
        }
        if (pending) {
          try {
            await createProfile(
              userId,
              pending,
              pendingStream,
              pendingElective,
              pendingExamDate,
              pendingZScore,
              pendingNote
            );
            name = pending.trim();
            profileStream = pendingStream;
            profileElective = pendingElective;
            profileExamDate = pendingExamDate;
            profileZScore = pendingZScore;
            profileNote = pendingNote;
            try {
              localStorage.removeItem('mindmaze_pending_username');
              localStorage.removeItem('mindmaze_pending_stream');
              localStorage.removeItem('mindmaze_pending_elective');
              localStorage.removeItem('mindmaze_pending_exam_date');
              localStorage.removeItem('mindmaze_pending_zscore');
              localStorage.removeItem('mindmaze_pending_note');
            } catch {}
          } catch {
            name = null; // Taken meanwhile — ask the student to pick another.
            pendingTopicIds = [];
          }
        }
      }
      if (!name) {
        setUsername(null);
        setUserRole('student');
        setAuthView('username');
        setCloudLoading(false);
        loadingRef.current = false;
        setAuthChecked(true);
        return;
      }
      setUsername(name);
      // Access role comes straight from profiles.role (see fetchUserProfile).
      // This is the single place the app learns whether to show the admin UI.
      setUserRole(profile.role === 'admin' ? 'admin' : 'student');

      // 1b. Study stream + elective: the profile values are the source of
      // truth when present and sync down to this device. Both are chosen
      // during sign-up and editable later in profile Settings (which sync
      // back up via handleSelectStream / handleSelectElective).
      if (
        profileStream === 'Physical Science' ||
        profileStream === 'Biological Science' ||
        profileStream === 'Maths' ||
        profileStream === 'Bio'
      ) {
        const normalized: StreamType =
          profileStream === 'Biological Science' || profileStream === 'Bio'
            ? 'Biological Science'
            : 'Physical Science';
        setSettings(saveUserSettings({ stream: normalized }));
      }

      // Elective syncs the same way stream does, so switching devices shows
      // the correct Chemistry / ICT choice automatically.
      if (profileElective === 'Chemistry' || profileElective === 'ICT') {
        setSettings(saveUserSettings({ physicalScienceElective: profileElective }));
      } else {
        // One-time migration for pre-elective accounts: if Supabase has no
        // elective but this device has an explicitly saved one, push it up
        // so it isn't lost. (Defaults alone are never pushed — Chemistry is
        // already the database default.)
        try {
          const raw = localStorage.getItem('mindmaze_user_settings_v2');
          const localElective = toElective(
            raw ? (JSON.parse(raw) as { physicalScienceElective?: unknown }).physicalScienceElective : null
          );
          if (localElective) {
            updateProfileElective(userId, localElective).catch((err) => {
              console.warn('Elective migration sync failed:', err);
            });
          }
        } catch {
          // Corrupt local settings — ignore, device default applies.
        }
      }

      // Exam date syncs the same way: profile wins when set, otherwise the
      // device default stays (countdown hidden until a date exists).
      if (profileExamDate) {
        setSettings(saveUserSettings({ targetExamDate: profileExamDate }));
      }

      // Goals sync down the same way (Z-score + motivation note). Local
      // values stay when the profile has none (e.g. pre-goals accounts).
      {
        const patch: Partial<UserSettings> = {};
        if (profileZScore) patch.targetZScore = profileZScore;
        if (profileNote) patch.motivationNote = profileNote;
        if (Object.keys(patch).length > 0) {
          setSettings(saveUserSettings(patch));
        }
      }

      // 2. Load cloud collections. Cloud wins when it has data;
      //    otherwise this device's local data is uploaded (first-login migration).
      const cloud = await loadCloudData(userId);

      // Brand-new signup = no timetable rows, no daily-task rows and no
      // streak row in the cloud. Start with 0 timetable blocks, 0 daily
      // tasks and a 0-day streak — never inherit demo data or a previous
      // student's local data from a shared device.
      // NOTE: topics are intentionally excluded — the sign-up flow itself
      // seeds topic rows for the student's own "already completed" picks
      // before this first load runs, and those must be kept.
      const isFreshAccount =
        !cloud.hasTimetable && !cloud.hasTasks && cloud.streak === null;

      let mergedTasks: DailyTask[] = dailyTasksRef.current;
      if (isFreshAccount) {
        clearStoredStreak();
        setTimetableEntries([]);
        saveStoredTimetable([]);
        setDailyTasks([]);
        saveStoredDailyTasks([]);
        mergedTasks = [];
        const zeroRevision = saveRevisionStats({ revisionCount: 0, revisionDates: [], lastRevisionDate: undefined });
        setRevisionStats(zeroRevision);
        const zeroStreak = calculateStreak([]);
        setStreakData(zeroStreak);
        try {
          await pushTimetable(userId, []);
        } catch (err) {
          console.warn('Fresh-account timetable reset failed:', err);
        }
        try {
          await pushTasks(userId, []);
        } catch (err) {
          console.warn('Fresh-account tasks reset failed:', err);
        }
        try {
          await pushStreak(userId, {
            currentStreak: 0,
            bestStreak: 0,
            lastCompletedDate: undefined,
            completedDates: [],
          });
        } catch (err) {
          console.warn('Fresh-account streak reset failed:', err);
        }
        try {
          await updateProfileRevisionCount(userId, 0);
        } catch {
          // Pre-migration DB or offline — non-fatal, stays 0 locally.
        }
        // Topics: wipe any prototype progress left on this shared device
        // back to the clean catalogue (all not_started). The student's own
        // sign-up picks — already in the cloud, or applied as pending picks
        // just below — then become the ONLY completed topics in the tracker.
        const cleanCatalogue: SyllabusTopic[] = INITIAL_SYLLABUS_TOPICS.map((t) => ({
          ...t,
          status: 'not_started' as TopicStatus,
          completedSubtopics: [],
          subtopicProgress: {},
        }));
        setSyllabusTopics(cleanCatalogue);
        saveStoredSyllabusTopics(cleanCatalogue);
      } else {
        if (cloud.hasTimetable) {
          setTimetableEntries(cloud.timetable);
          saveStoredTimetable(cloud.timetable);
        } else if (timetableEntriesRef.current.length > 0) {
          await pushTimetable(userId, timetableEntriesRef.current);
        }

        if (cloud.hasTasks) {
          mergedTasks = cloud.tasks;
          setDailyTasks(cloud.tasks);
          saveStoredDailyTasks(cloud.tasks);
        } else if (dailyTasksRef.current.length > 0) {
          await pushTasks(userId, dailyTasksRef.current);
        }
      }

      if (cloud.topics) {
        const cloudById = new Map(cloud.topics.map((t) => [t.id, t]));
        const localTopics = getStoredSyllabusTopics();
        const merged = [
          ...localTopics.map((t) => cloudById.get(t.id) ?? t),
          ...cloud.topics.filter((t) => !localTopics.some((l) => l.id === t.id)),
        ];
        setSyllabusTopics(merged);
        saveStoredSyllabusTopics(merged);
        await pushTopics(userId, merged);
      } else {
        const localTopics = getStoredSyllabusTopics();
        if (localTopics.length > 0) await pushTopics(userId, localTopics);
      }

      // 2b. Pending sign-up topic selections (email-confirm flow): mark them
      // completed in the resolved list so Dashboard + Tracker reflect the
      // head start immediately, then sync up and clear the pending stash.
      if (pendingTopicIds.length > 0) {
        try {
          const current = getStoredSyllabusTopics();
          const withCompleted = markTopicsCompleted(current, pendingTopicIds);
          setSyllabusTopics(withCompleted);
          saveStoredSyllabusTopics(withCompleted);
          await pushTopics(userId, withCompleted);
        } catch (err) {
          console.warn('Pending topics sync failed:', err);
        }
        try {
          localStorage.removeItem('mindmaze_pending_topics');
        } catch {}
      }

      // 3. Merge streak history (union of completed dates across devices),
      //    then recalculate with the existing streak logic.
      //    Skipped for fresh accounts — already zeroed above.
      if (!isFreshAccount) {
        if (cloud.streak) {
          try {
            const KEY = 'mindmaze_study_streak_v2';
            const raw = localStorage.getItem(KEY);
            const parsed = raw ? JSON.parse(raw) : { bestStreak: 0, completedDates: [] };
            const dateSet = new Set<string>([
              ...(Array.isArray(parsed.completedDates) ? parsed.completedDates : []),
              ...cloud.streak.completedDates,
            ]);
            localStorage.setItem(
              KEY,
              JSON.stringify({
                bestStreak: Math.max(parsed.bestStreak ?? 0, cloud.streak.longestStreak),
                completedDates: Array.from(dateSet).sort(),
                lastCompletedDate: parsed.lastCompletedDate ?? cloud.streak.lastCompletedDate,
              })
            );
          } catch {}
        }
        const freshStreak = calculateStreak(mergedTasks);
        setStreakData(freshStreak);
        await pushStreak(userId, {
          currentStreak: freshStreak.currentStreak,
          bestStreak: freshStreak.bestStreak,
          lastCompletedDate: freshStreak.lastCompletedDate,
          completedDates: freshStreak.completedDates,
        });
      }

      // 4. Revision counter: cloud wins when larger (additive habit stat).
      //    Skipped for fresh accounts — already zeroed above.
      if (!isFreshAccount) {
        try {
          const cloudRevisions = await fetchRevisionCount(userId);
          if (cloudRevisions !== null) {
            const local = getRevisionStats();
            if (cloudRevisions > local.revisionCount) {
              const merged = saveRevisionStats({
                revisionCount: cloudRevisions,
                revisionDates: local.revisionDates,
                lastRevisionDate: local.lastRevisionDate,
              });
              setRevisionStats(merged);
            } else if (local.revisionCount > cloudRevisions) {
              await updateProfileRevisionCount(userId, local.revisionCount).catch(() => undefined);
            }
          }
        } catch (err) {
          console.warn('Revision count sync failed:', err);
        }
      }

      loadedUidRef.current = userId;
      setCloudSyncOn(true);
    } catch (err) {
      const msg =
        err instanceof CloudError
          ? err.userMessage
          : 'Could not reach the cloud. Using your offline data for now.';
      setCloudError(msg);
      // Offline-tolerant: keep using local data, enable sync so later edits retry.
      setCloudSyncOn(true);
    } finally {
      setCloudLoading(false);
      loadingRef.current = false;
      setAuthChecked(true);
    }
  };

  const handleSessionUser = (userId: string | null) => {
    authUserIdRef.current = userId;
    if (!userId) {
      setAuthUserId(null);
      setUsername(null);
      setUserRole('student');
      loadedUidRef.current = null;
      setCloudSyncOn(false);
      setCloudLoading(false);
      setCloudError(null);
      setSignupStream(null);
      // Clear per-device study mirrors so the next signup on this shared
      // device starts with 0 blocks and a 0-day streak (the signed-out
      // student's data remains safe in the cloud and reloads on sign-in).
      clearStoredStreak();
      setTimetableEntries([]);
      saveStoredTimetable([]);
      setDailyTasks([]);
      saveStoredDailyTasks([]);
      setStreakData({ currentStreak: 0, bestStreak: 0, completedDates: [], isCompletedToday: false });
      setRevisionStats(saveRevisionStats({ revisionCount: 0, revisionDates: [], lastRevisionDate: undefined }));
      setAuthChecked(true);
      return;
    }
    setAuthUserId(userId);
    // Pick up stream/elective choices saved on this device.
    try {
      setSettings(getUserSettings());
    } catch {}
    void loadCloudForUser(userId);
  };

  // Refs mirror state for use inside the one-time loader above.
  const timetableEntriesRef = useRef(timetableEntries);
  const dailyTasksRef = useRef(dailyTasks);
  timetableEntriesRef.current = timetableEntries;
  dailyTasksRef.current = dailyTasks;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // No backend configured: stay signed out. The render gate below shows
      // the public landing page at "/" — never the Dashboard — until a real
      // session exists. (SupabaseAuth renders a "not configured" notice on
      // /login and /signup in this state.)
      setAuthChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      handleSessionUser(data.session?.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery link gives a session: record it, but force the
        // choose-new-password screen before entering the app.
        authUserIdRef.current = session?.user?.id ?? null;
        if (session?.user?.id) setAuthUserId(session.user.id);
        setAuthView('update-password');
        setAuthChecked(true);
        return;
      }
      handleSessionUser(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Debounced cloud write-back (localStorage stays the instant offline mirror) ----
  useEffect(() => {
    if (!cloudSyncOn || !authUserIdRef.current || !isSupabaseConfigured || !supabase) return;
    const userId = authUserIdRef.current;
    const timer = setTimeout(() => {
      pushTimetable(userId, timetableEntries).catch((err) => {
        console.warn('Timetable cloud sync failed:', err);
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [timetableEntries, cloudSyncOn]);

  useEffect(() => {
    if (!cloudSyncOn || !authUserIdRef.current || !isSupabaseConfigured || !supabase) return;
    const userId = authUserIdRef.current;
    const timer = setTimeout(() => {
      pushTasks(userId, dailyTasks).catch((err) => {
        console.warn('Tasks cloud sync failed:', err);
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [dailyTasks, cloudSyncOn]);

  useEffect(() => {
    if (!cloudSyncOn || !authUserIdRef.current || !isSupabaseConfigured || !supabase) return;
    const userId = authUserIdRef.current;
    const timer = setTimeout(() => {
      pushTopics(userId, syllabusTopics).catch((err) => {
        console.warn('Topics cloud sync failed:', err);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [syllabusTopics, cloudSyncOn]);

  useEffect(() => {
    if (!cloudSyncOn || !authUserIdRef.current || !isSupabaseConfigured || !supabase) return;
    const userId = authUserIdRef.current;
    const timer = setTimeout(() => {
      pushStreak(userId, {
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        lastCompletedDate: streakData.lastCompletedDate,
        completedDates: streakData.completedDates,
      }).catch((err) => {
        console.warn('Streak cloud sync failed:', err);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [streakData, cloudSyncOn]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    handleSessionUser(null);
    setCurrentScreen('dashboard');
    navigateTo('/');
  };

  const handleAuthReady = (name: string) => {
    setUsername(name);
    navigateTo(SCREEN_PATHS[currentScreen]);
    const uid = authUserIdRef.current;
    if (uid && loadedUidRef.current !== uid) {
      void loadCloudForUser(uid);
    }
  };

  const handleRetryCloudLoad = () => {
    const uid = authUserIdRef.current;
    if (uid) {
      loadedUidRef.current = null;
      void loadCloudForUser(uid);
    }
  };

  /** Best-effort cloud mirror of the revision counter (never blocks UI). */
  async function syncRevisionCountToCloud(count: number) {
    const uid = authUserIdRef.current;
    if (!uid || !isSupabaseConfigured || !supabase) return;
    try {
      await updateProfileRevisionCount(uid, count);
    } catch (err) {
      console.warn('Revision count cloud sync failed:', err);
    }
  }

  // Periodic reminder checker every 30 seconds (timetable alerts + nudges + daily countdown)
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

      // 3. Daily A/L countdown (once each morning ≥8 AM; skipped without a
      //    future exam date or notification permission — see helper).
      const countdownRes = maybeSendDailyCountdown(settings.targetExamDate, settings.motivationNote);
      if (countdownRes.sent && countdownRes.message) {
        setActiveToastReminder(countdownRes.message);
        setTimeout(() => setActiveToastReminder(null), 8000);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [timetableEntries, dailyTasks, streakData.currentStreak, settings.targetExamDate, settings.motivationNote]);

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

    sendStudyNotification(smartMsg.title, smartMsg.body, '/icon-192.png', 'mind-maze-smart-test');
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
      blockType: normalizeBlockType(entryData.blockType),
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
        blockType: normalizeBlockType(newEntry.blockType),
        topicId: newEntry.topicId,
        topicTitle: newEntry.topic,
        subtopic: newEntry.subtopic,
        targetProgress: newEntry.targetProgress,
        subtopicTargets: newEntry.subtopicTargets,
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
    const normalized = { ...updatedEntry, blockType: normalizeBlockType(updatedEntry.blockType) };
    const updated = timetableEntries.map((e) => (e.id === normalized.id ? normalized : e));
    setTimetableEntries(updated);
    saveStoredTimetable(updated);

    // If there is an associated linked task in the Daily Planner, update it in sync
    const hasLinkedTask = dailyTasks.some(
      (t) => t.fromTimetableId === normalized.id || (normalized.fromTaskId && t.id === normalized.fromTaskId)
    );

    if (hasLinkedTask) {
      const estMinutes = calculateMinutesBetween(normalized.startTime, normalized.endTime);
      const newDate = getDateForDayOfWeekInCurrentWeek(normalized.dayOfWeek);
      const updatedTasks = dailyTasks.map((t) => {
        if (t.fromTimetableId === normalized.id || (normalized.fromTaskId && t.id === normalized.fromTaskId)) {
          return {
            ...t,
            date: newDate,
            title: normalized.topic,
            subject: normalized.subject,
            blockType: normalizeBlockType(normalized.blockType),
            topicId: normalized.topicId ?? t.topicId,
            topicTitle: normalized.topic,
            subtopic: normalized.subtopic,
            targetProgress: normalized.targetProgress,
            subtopicTargets: normalized.subtopicTargets,
            timeSlot: `${normalized.startTime} - ${normalized.endTime}`,
            startTime: normalized.startTime,
            endTime: normalized.endTime,
            estimatedMinutes: estMinutes,
          };
        }
        return t;
      });
      setDailyTasks(updatedTasks);
      saveStoredDailyTasks(updatedTasks);
      setSyncToastMessage(`🔗 Updated linked task in Daily Planner for ${normalized.dayOfWeek}`);
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
    const blockType = normalizeBlockType(entry.blockType);

    const updated = timetableEntries.map((e) =>
      e.id === entryId ? { ...e, isCompleted: willBeCompleted } : e
    );
    setTimetableEntries(updated);
    saveStoredTimetable(updated);

    // Revision bonus: additive reward, syllabus % untouched.
    if (blockType === 'revision') {
      if (willBeCompleted) {
        const next = recordRevisionCompletion(getTodayDateString());
        setRevisionStats(next);
        void syncRevisionCountToCloud(next.revisionCount);
        playStudyChime();
        pushCelebration({
          kind: 'revision',
          emoji: '🔁',
          title: 'Great habit! Revising keeps it fresh 🔁',
          message: `Revision session done — that's ${next.revisionCount} revision${next.revisionCount === 1 ? '' : 's'} banked. Small reps, big A/L recall.`,
          stats: [
            { label: 'Revisions', value: String(next.revisionCount) },
            { label: 'Day streak', value: `${streakData.currentStreak}d` },
            { label: 'Syllabus %', value: 'unchanged' },
          ],
        });
      } else {
        const next = undoRevisionCompletion();
        setRevisionStats(next);
        void syncRevisionCountToCloud(next.revisionCount);
      }
      return;
    }

    // Sync syllabus progress if entry has topic or subtopic
    const syncRes = updateSyllabusFromBlockCompletion(syllabusTopics, {
      topicId: entry.topicId,
      topicTitle: entry.topic,
      subtopic: entry.subtopic,
      targetProgress: entry.targetProgress,
      subtopicTargets: entry.subtopicTargets,
      subject: entry.subject,
      isCompleted: willBeCompleted,
      blockType,
    });

    if (syncRes.changeMessage) {
      // Full-subject-completion badge: celebrate when this block pushes its
      // whole subject to 100% coverage for the first time.
      if (
        willBeCompleted &&
        didSubjectJustComplete(syllabusTopics, syncRes.updatedTopics, entry.subject)
      ) {
        pushCelebration({
          kind: 'subject',
          emoji: '🏅',
          title: `${entry.subject} Complete!`,
          message: `Incredible — every syllabus topic in ${entry.subject} is now at 100%. Past-paper season for this subject starts now!`,
          stats: [{ label: 'Coverage', value: '100%' }],
        });
      }
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
    const taskBlockType = normalizeBlockType(targetTask.blockType);

    // Revision bonus path: distinct celebration + counter, syllabus % untouched.
    // Streak still updates (additive reward, never a penalty).
    let revisionTotal: number | null = null;
    if (taskBlockType === 'revision') {
      if (willBeCompleted) {
        const next = recordRevisionCompletion(getTodayDateString());
        setRevisionStats(next);
        revisionTotal = next.revisionCount;
        void syncRevisionCountToCloud(next.revisionCount);
      } else {
        const next = undoRevisionCompletion();
        setRevisionStats(next);
        void syncRevisionCountToCloud(next.revisionCount);
      }
    }

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

    // Refresh and persist streak (capture the previous value for milestones)
    const prevStreak = streakData.currentStreak;
    const newStreak = recordTaskCompletionAndRefreshStreak(updated, willBeCompleted && targetTask.date === todayStr);
    setStreakData(newStreak);

    if (willBeCompleted && targetTask.date === todayStr) {
      if (taskBlockType === 'revision' && revisionTotal !== null) {
        // Distinct revision micro-celebration (on top of the normal flow).
        playStudyChime();
        pushCelebration({
          kind: 'revision',
          emoji: '🔁',
          title: 'Great habit! Revising keeps it fresh 🔁',
          message: `Revision session done — ${revisionTotal} revision${revisionTotal === 1 ? '' : 's'} banked in total. Your syllabus % stays exactly where it was.`,
          stats: [
            { label: 'Revisions', value: String(revisionTotal) },
            { label: 'Day streak', value: `${newStreak.currentStreak}d` },
            { label: 'Done today', value: `${newTodayTasks.filter((t) => t.isCompleted).length}/${newTodayTasks.length}` },
          ],
        });
      } else if (!wasAllDoneBefore && isAllDoneNow) {
        // Full-day-complete modal with stats + congratulatory notification.
        const congrats = generateCompletionCelebration({
          currentStreak: newStreak.currentStreak,
          totalCompletedCount: newTodayTasks.length,
        });
        sendStudyNotification(congrats.title, congrats.body, '/icon-192.png', 'mind-maze-completion');
        const subjectsCovered = new Set(newTodayTasks.map((t) => t.subject)).size;
        pushCelebration({
          kind: 'day',
          emoji: '🎉',
          title: congrats.title,
          message: `${congrats.body} You cleared every planned session today — take a real break, you've earned it!`,
          stats: [
            { label: 'Done today', value: String(newTodayTasks.length) },
            { label: 'Day streak', value: `${newStreak.currentStreak}d` },
            { label: 'Subjects', value: String(subjectsCovered) },
          ],
          actionLabel: 'View My Progress',
        });
      } else {
        // Per-task micro-celebration: quick chime + progress toast.
        playStudyChime();
        const doneCount = newTodayTasks.filter((t) => t.isCompleted).length;
        setActiveToastReminder(
          `✅ "${targetTask.title.length > 42 ? `${targetTask.title.slice(0, 42)}…` : targetTask.title}" done — ${doneCount} of ${newTodayTasks.length} today. Keep it up!`
        );
        setTimeout(() => setActiveToastReminder(null), 4000);
      }

      // Weekly (and bigger) streak milestones.
      const milestone = crossedMilestone(prevStreak, newStreak.currentStreak);
      if (milestone !== null) {
        pushCelebration({
          kind: 'streak',
          emoji: milestone >= 30 ? '🏆' : '🔥',
          title: `${milestone}-Day Streak!`,
          message:
            milestone === 7
              ? 'A full week of consistent study — this is where toppers are made. Protect the flame!'
              : `${milestone} straight days of hitting your plan. Extraordinary discipline — your A/L self thanks you!`,
          stats: [
            { label: 'Streak', value: `${newStreak.currentStreak}d` },
            { label: 'Best', value: `${newStreak.bestStreak}d` },
          ],
        });
      }
    }

    // Bi-directionally update syllabus progress if this task corresponds to a syllabus topic or subtopic
    // (Revision blocks skip this entirely — percentages never move on revision.)
    const syncRes = updateSyllabusFromBlockCompletion(syllabusTopics, {
      topicId: targetTask.topicId,
      topicTitle: targetTask.topicTitle || targetTask.title,
      subtopic: targetTask.subtopic,
      targetProgress: targetTask.targetProgress,
      subtopicTargets: targetTask.subtopicTargets,
      subject: targetTask.subject,
      isCompleted: willBeCompleted,
      blockType: taskBlockType,
    });

    if (syncRes.changeMessage) {
      // Full-subject-completion badge: celebrate the subject's first 100%.
      if (
        willBeCompleted &&
        didSubjectJustComplete(syllabusTopics, syncRes.updatedTopics, targetTask.subject)
      ) {
        pushCelebration({
          kind: 'subject',
          emoji: '🏅',
          title: `${targetTask.subject} Complete!`,
          message: `Incredible — every syllabus topic in ${targetTask.subject} is now at 100%. Past-paper season for this subject starts now!`,
          stats: [{ label: 'Coverage', value: '100%' }],
        });
      }
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
      blockType: normalizeBlockType(taskData.blockType),
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
        blockType: normalizeBlockType(newTask.blockType),
        topic: newTask.title,
        topicId: newTask.topicId,
        subtopic: newTask.subtopic,
        targetProgress: newTask.targetProgress,
        subtopicTargets: newTask.subtopicTargets,
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
        blockType: normalizeBlockType(b.blockType),
        topicId: b.topicId,
        topicTitle: b.topic,
        subtopic: b.subtopic,
        targetProgress: b.targetProgress,
        subtopicTargets: b.subtopicTargets,
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
  // Stream is edited after sign-in from the head-bar menu or profile
  // Settings. Saves locally instantly and syncs to the Supabase profile
  // (source of truth across devices) when signed in.
  const handleSelectStream = (newStream: StreamType) => {
    const updated = saveUserSettings({ stream: newStream });
    setSettings(updated);
    const uid = authUserIdRef.current;
    if (!uid || !isSupabaseConfigured || !supabase) return;
    const canonical =
      newStream === 'Biological Science' || (newStream as string) === 'Bio'
        ? 'Biological Science'
        : 'Physical Science';
    updateProfileStream(uid, canonical).catch((err) => {
      console.warn('Stream cloud sync failed:', err);
      setSyncToastMessage('⚠️ Stream saved on this device, but cloud sync failed. It will retry on your next change.');
    });
  };

  const handleSelectElective = (newElective: 'Chemistry' | 'ICT') => {
    const updated = saveUserSettings({ physicalScienceElective: newElective });
    setSettings(updated);
    const uid = authUserIdRef.current;
    if (!uid || !isSupabaseConfigured || !supabase) return;
    updateProfileElective(uid, newElective).catch((err) => {
      console.warn('Elective cloud sync failed:', err);
      setSyncToastMessage('⚠️ Elective saved on this device, but cloud sync failed. It will retry on your next change.');
    });
  };

  // Expected A/L date: saved locally instantly (drives the Dashboard
  // countdown) and synced to the Supabase profile when signed in.
  // Pass '' to clear (countdown hides until a date is set again).
  const handleUpdateExamDate = (dateStr: string) => {
    const clean = toExamDate(dateStr);
    if (dateStr && !clean) return;
    const updated = saveUserSettings({ targetExamDate: clean ?? '' });
    setSettings(updated);
    const uid = authUserIdRef.current;
    if (!uid || !isSupabaseConfigured || !supabase) return;
    updateProfileExamDate(uid, clean).catch((err) => {
      console.warn('Exam date cloud sync failed:', err);
      setSyncToastMessage('⚠️ Exam date saved on this device, but cloud sync failed. It will retry on your next change.');
    });
  };

  // Goals (Z-score + motivation note): saved locally instantly and synced
  // to the Supabase profile when signed in. Blank clears that field.
  const handleUpdateGoals = (goals: { targetZScore: string; motivationNote: string }) => {
    const updated = saveUserSettings({
      targetZScore: goals.targetZScore.trim(),
      motivationNote: goals.motivationNote.trim(),
    });
    setSettings(updated);
    const uid = authUserIdRef.current;
    if (!uid || !isSupabaseConfigured || !supabase) return;
    updateProfileGoals(uid, {
      targetZScore: goals.targetZScore.trim() || null,
      motivationNote: goals.motivationNote.trim() || null,
    }).catch((err) => {
      console.warn('Goals cloud sync failed:', err);
      setSyncToastMessage('⚠️ Goals saved on this device, but cloud sync failed. They will retry on your next change.');
    });
  };

  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    const updated = saveUserSettings(partial);
    setSettings(updated);
  };

  // Navigation (in-app screens also update the URL so refresh/back button work)
  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    navigateTo(SCREEN_PATHS[screen]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // One-time onboarding explainer: shown once after sign-up/login when
  // notifications are still undecided. Per-account key so shared devices
  // each get their own single showing. Never fires the native prompt —
  // it only OPENS the explainer modal (prompt needs an explicit tap).
  const notifierExplainerSeenKey = () =>
    `mindmaze_notif_explainer_seen_${authUserIdRef.current ?? 'local'}`;
  const markNotifierExplainerSeen = () => {
    try {
      localStorage.setItem(notifierExplainerSeenKey(), '1');
    } catch {}
  };

  useEffect(() => {
    if (!authChecked || cloudLoading || !authUserId || !username) return;
    if (notificationPermission !== 'default') return;
    if (isNotificationModalOpen) return;
    let seen = false;
    try {
      seen = localStorage.getItem(notifierExplainerSeenKey()) === '1';
    } catch {}
    if (seen) return;
    markNotifierExplainerSeen();
    setIsNotificationModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, cloudLoading, authUserId, username, notificationPermission]);

  const handleAuthViewChange = (view: AuthView) => {
    setAuthView(view);
    if (view === 'signin') navigateTo('/login');
    else if (view === 'signup') navigateTo('/signup');
  };

  // Landing page links use legacy marketing targets ('study-plan',
  // 'daily-topics', 'landing') alongside real app screens. Signed-out
  // visitors are sent to /signup for anything needing an account.
  const handleLandingNavigate = (screen: string) => {
    if (screen === 'landing') {
      navigateTo('/');
      return;
    }
    const appScreen = screenForPath(screen.startsWith('/') ? screen : `/${screen}`);
    if (appScreen) {
      if (authUserIdRef.current) handleNavigate(appScreen);
      else navigateTo('/signup');
      return;
    }
    if (authUserIdRef.current) handleNavigate('dashboard');
    else navigateTo('/signup');
  };

  // Tiny branded pause for the public landing page: after ~600ms the
  // landing renders immediately without waiting for the session check.
  // (App screens still wait for auth + cloud sync as before.)
  const [landingReady, setLandingReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLandingReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Today pending count for bottom nav badge
  const todayDate = getTodayDateString();
  const pendingCount = dailyTasks.filter((t) => t.date === todayDate && !t.isCompleted).length;

  const splash = (message: string, sub?: string) => (
    <div className="relative min-h-screen bg-[#0F1023] bg-[radial-gradient(circle_at_top_right,_#1a1b3d_0%,_#0F1023_100%)] text-slate-100 flex items-center justify-center px-4 font-['Poppins',sans-serif]">
      <MazeBackground opacity={0.25} />
      <div className="relative text-center space-y-4">
        <img
          src="/icon-192.png"
          alt="Mind Maze logo"
          width={192}
          height={192}
          className="w-20 h-20 rounded-3xl object-cover ring-1 ring-white/10 shadow-[0_0_30px_rgba(107,78,255,0.4)] mx-auto"
          draggable={false}
        />
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>{message}</span>
        </div>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );

  // ---- Auth gate & cloud loading states ----
  // Strict rule: without a valid session (authUserId), only the public
  // landing page ("/") or the auth screens are ever rendered. The Dashboard
  // and all other app screens require a real Supabase session, regardless of
  // any cached localStorage data or default settings.
  // Exception: the public landing page renders after a tiny (~600ms)
  // branded pause without waiting for the session check, so it feels
  // instant. A signed-in visitor is still redirected to /dashboard as soon
  // as the session resolves (see the route-guard effect above).
  const renderLandingPage = () => (
    <LandingPage
      onNavigate={handleLandingNavigate}
      onSelectStreamAndStart={(stream) => {
        // Landing-page stream tap becomes this device's default and
        // pre-selects the signup form's stream picker.
        handleSelectStream(stream);
        setSignupStream(stream === 'Bio' ? 'Biological Science' : 'Physical Science');
        navigateTo('/signup');
      }}
      onOpenAuth={(mode) => navigateTo(mode === 'signup' ? '/signup' : '/login')}
    />
  );

  if (!authChecked) {
    if (routePath === '/' && landingReady) {
      return renderLandingPage();
    }
    // Email-confirmation link target: renders immediately with its own
    // verifying state instead of waiting for the session check.
    if (routePath === '/confirmed') {
      return <EmailConfirmed />;
    }
    return splash('Loading Mind Maze…');
  }

  if (authView === 'update-password' && authUserId) {
    return (
      <SupabaseAuth
        view="update-password"
        onViewChange={(v) => {
          setAuthView(v);
          if (v === 'signin') {
            // Recovery session is now a normal session — enter the app.
            if (supabase) {
              supabase.auth.getUser().then(({ data }) => {
                handleSessionUser(data.user?.id ?? authUserIdRef.current);
              });
            } else {
              handleSessionUser(authUserIdRef.current);
            }
          }
        }}
      />
    );
  }

  if (!authUserId) {
    // Public landing page for signed-out visitors at "/".
    if (routePath === '/') {
      return renderLandingPage();
    }
    // Email-confirmation link target (public): shows the verified success
    // state instead of the sign-up form when the link opens a new tab.
    if (routePath === '/confirmed') {
      return <EmailConfirmed />;
    }
    // "/login", "/signup", and protected routes (e.g. "/dashboard") all show
    // the login screen until the visitor signs in.
    return <SupabaseAuth view={authView} onViewChange={handleAuthViewChange} onAuthReady={handleAuthReady} initialStream={signupStream} />;
  }

  // Verified link opened while already signed in: celebrate first, then let
  // the student continue into the app via the screen's own button.
  if (routePath === '/confirmed') {
    return <EmailConfirmed />;
  }

  if (isSupabaseConfigured && authUserId && !username && !cloudLoading) {
    return (
      <SupabaseAuth view="username" onViewChange={handleAuthViewChange} onAuthReady={handleAuthReady} />
    );
  }

  if (isSupabaseConfigured && authUserId && cloudLoading) {
    return splash('Syncing your study data…', username ? `Welcome back, ${username}!` : 'Fetching timetable, topics & streak from the cloud…');
  }

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

      {/* Celebration modal queue (day / subject / streak milestones) */}
      <CelebrationModal
        celebration={celebrations[0] ?? null}
        onClose={dismissCelebration}
        onAction={
          celebrations[0]?.actionLabel
            ? () => {
                dismissCelebration();
                handleNavigate('progress');
              }
            : undefined
        }
      />

      {/* Primary Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={() => setIsNotificationModalOpen(true)}
        currentStreak={streakData.currentStreak}
        isAdmin={userRole === 'admin'}
        username={username}
        onSignOut={isSupabaseConfigured && authUserId ? handleSignOut : undefined}
      />

      {/* Cloud sync problem banner (offline-tolerant: local data still works) */}
      {cloudError && authUserId && (
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 pt-3">
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>⚠️ {cloudError}</span>
            <button
              onClick={handleRetryCloudLoad}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 font-bold transition cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Sync</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Container */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-12">
        {currentScreen === 'dashboard' && (
          <DashboardOverview
            stream={settings.stream}
            physicalScienceElective={settings.physicalScienceElective}
            timetableEntries={timetableEntries}
            dailyTasks={dailyTasks}
            syllabusTopics={syllabusTopics}
            streakData={streakData}
            revisionCount={revisionStats.revisionCount}
            examDate={settings.targetExamDate || null}
            targetZScore={settings.targetZScore || null}
            motivationNote={settings.motivationNote || null}
            onNavigateToSettings={() => handleNavigate('settings')}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={() => setIsNotificationModalOpen(true)}
            onTestSmartReminder={handleTestSmartReminder}
            onTestNudge={handleTestNudge}
            onNavigate={handleNavigate}
            onToggleTask={handleToggleTask}
            username={username}
          />
        )}

        {currentScreen === 'timetable' && (
          <WeeklyTimetable
            entries={timetableEntries}
            syllabusTopics={syllabusTopics}
            stream={settings.stream}
            physicalScienceElective={settings.physicalScienceElective}
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
            revisionCount={revisionStats.revisionCount}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            stream={settings.stream}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateExamDate={handleUpdateExamDate}
            onUpdateGoals={handleUpdateGoals}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={() => setIsNotificationModalOpen(true)}
            onSendTestNotification={handleTestSmartReminder}
            username={username}
            userRole={userRole}
            isAdmin={userRole === 'admin'}
            onNavigateToAdmin={() => handleNavigate('admin')}
            onSelectStream={handleSelectStream}
            onSelectElective={handleSelectElective}
            cloudSyncEnabled={isSupabaseConfigured && authUserId !== null}
            onSignOut={isSupabaseConfigured && authUserId ? handleSignOut : undefined}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminPanel
            userRole={userRole}
            username={username}
            profileLoaded={username !== null}
            onNavigateHome={() => handleNavigate('dashboard')}
          />
        )}
      </main>

      {/* Thumb-Reachable Smartphone Bottom Navigation Bar */}
      <MobileBottomBar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        pendingDailyTasksCount={pendingCount}
      />

      {/* Notification Permission Explanation & Consent Modal.
          Explainer-first: the native browser prompt fires ONLY from the
          modal's "Enable" button tap — never automatically on page load. */}
      <NotificationPermissionModal
        isOpen={isNotificationModalOpen}
        onClose={() => {
          setIsNotificationModalOpen(false);
          markNotifierExplainerSeen();
        }}
        onPermissionUpdated={(perm) => {
          setNotificationPermission(perm);
          markNotifierExplainerSeen();
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
