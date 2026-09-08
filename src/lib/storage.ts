import { DailyTask, SyllabusTopic, TimetableEntry, UserSettings, StreamType } from '../types';
import { INITIAL_SYLLABUS_TOPICS, INITIAL_TIMETABLE_ENTRIES } from '../data/alSyllabusData';

const TIMETABLE_STORAGE_KEY = 'mindmaze_timetable_v2';
const DAILY_TASKS_STORAGE_KEY = 'mindmaze_daily_tasks_v2';
const TOPICS_STORAGE_KEY = 'mindmaze_syllabus_topics_v2';
const SETTINGS_STORAGE_KEY = 'mindmaze_user_settings_v2';

export const DEFAULT_SETTINGS: UserSettings = {
  stream: 'Physical Science',
  physicalScienceElective: 'Chemistry',
  studentName: 'A/L Scholar',
  targetExamYear: '2027',
  targetExamDate: '',
  targetZScore: '2.450',
  motivationNote: '',
  reminderSoundEnabled: true,
  notificationsGranted: false,
  hasSeenNotificationPrompt: false,
  weeklyHoursGoal: 28,
};

// ================= TIMETABLE STORAGE =================
export function getStoredTimetable(): TimetableEntry[] {
  try {
    const raw = localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (!raw) {
      saveStoredTimetable(INITIAL_TIMETABLE_ENTRIES);
      return INITIAL_TIMETABLE_ENTRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TIMETABLE_ENTRIES;
  } catch (e) {
    console.warn('Failed to parse timetable from localStorage, fallback to initial', e);
    return INITIAL_TIMETABLE_ENTRIES;
  }
}

export function saveStoredTimetable(entries: TimetableEntry[]): void {
  try {
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save timetable to localStorage', e);
  }
}

// ================= DAILY TASKS STORAGE =================
export function getStoredDailyTasks(dateStr?: string): DailyTask[] {
  try {
    const raw = localStorage.getItem(DAILY_TASKS_STORAGE_KEY);
    if (!raw) {
      // Generate default initial tasks for today from today's timetable
      return [];
    }
    const parsed: DailyTask[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (dateStr) {
      return parsed.filter((t) => t.date === dateStr);
    }
    return parsed;
  } catch (e) {
    console.warn('Failed to parse daily tasks from localStorage', e);
    return [];
  }
}

export function saveStoredDailyTasks(tasks: DailyTask[]): void {
  try {
    localStorage.setItem(DAILY_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save daily tasks to localStorage', e);
  }
}

// ================= TOPICS STORAGE =================
export function getStoredSyllabusTopics(): SyllabusTopic[] {
  try {
    const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
    if (!raw) {
      saveStoredSyllabusTopics(INITIAL_SYLLABUS_TOPICS);
      return INITIAL_SYLLABUS_TOPICS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveStoredSyllabusTopics(INITIAL_SYLLABUS_TOPICS);
      return INITIAL_SYLLABUS_TOPICS;
    }

    // Migrate any stored syllabus to the latest detailed version (Physics 1-11,
    // Chemistry 1-14, Biology 1-10, ICT 1-14, Combined Maths Pure+Applied 1-18).
    // Preserves user progress (status / notes) while refreshing subtopic lists.
    // Custom user topics (isCustom) are always preserved.
    const needsMigration =
      parsed.length !== INITIAL_SYLLABUS_TOPICS.length ||
      (parsed as SyllabusTopic[]).some((t: SyllabusTopic) => t.id === 'phy-12' || t.id === 'phy-17') ||
      INITIAL_SYLLABUS_TOPICS.some((fresh) => {
        if (fresh.isCustom) return false;
        const existing = (parsed as SyllabusTopic[]).find((p: SyllabusTopic) => p.id === fresh.id);
        if (!existing) return true;
        const existingSubs = existing.subtopics || [];
        const freshSubs = fresh.subtopics || [];
        if (existingSubs.length !== freshSubs.length) return true;
        if (fresh.topicTitle !== existing.topicTitle || fresh.unitTitle !== existing.unitTitle) return true;
        return freshSubs.some((s) => !existingSubs.includes(s));
      });

    if (needsMigration) {
      const customTopics = (parsed as SyllabusTopic[]).filter((t: SyllabusTopic) => t.isCustom);
      const merged = INITIAL_SYLLABUS_TOPICS.map((fresh) => {
        const existing = (parsed as SyllabusTopic[]).find((p: SyllabusTopic) => p.id === fresh.id);
        if (existing) {
          const freshSubs = fresh.subtopics || [];
          // Keep only completed subtopics that still exist in the new detailed list
          const keptCompleted = (existing.completedSubtopics || []).filter((s: string) =>
            freshSubs.includes(s)
          );
          const keptProgress: Record<string, number> = {};
          for (const [k, v] of Object.entries(existing.subtopicProgress || {})) {
            if (freshSubs.includes(k)) keptProgress[k] = v;
          }
          return {
            ...fresh,
            status: existing.status || fresh.status,
            completedSubtopics: keptCompleted,
            subtopicProgress: keptProgress,
            notes: existing.notes || fresh.notes,
          };
        }
        return fresh;
      });
      const updated = [...merged, ...customTopics];
      saveStoredSyllabusTopics(updated);
      return updated;
    }

    return parsed;
  } catch (e) {
    console.warn('Failed to parse syllabus topics from localStorage', e);
    return INITIAL_SYLLABUS_TOPICS;
  }
}

export function saveStoredSyllabusTopics(topics: SyllabusTopic[]): void {
  try {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  } catch (e) {
    console.error('Failed to save syllabus topics to localStorage', e);
  }
}

// ================= USER SETTINGS STORAGE =================
export function getUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      saveUserSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const normalizedStream: StreamType =
      parsed.stream === 'Bio' || parsed.stream === 'Biological Science'
        ? 'Biological Science'
        : 'Physical Science';

    const normalizedElective: 'Chemistry' | 'ICT' =
      parsed.physicalScienceElective === 'ICT' ? 'ICT' : 'Chemistry';

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      stream: normalizedStream,
      physicalScienceElective: normalizedElective,
    };
  } catch (e) {
    console.warn('Failed to parse settings from localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  try {
    const current = getUserSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

// ================= DATE HELPERS =================
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDayOfWeek(): TimetableEntry['dayOfWeek'] {
  const days: TimetableEntry['dayOfWeek'][] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[new Date().getDay()];
}

export function getFormattedDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns DayOfWeek (e.g. 'Monday') for a given YYYY-MM-DD date string
 */
export function getDayOfWeekFromDate(dateStr: string): TimetableEntry['dayOfWeek'] {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days: TimetableEntry['dayOfWeek'][] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  } catch {
    return 'Monday';
  }
}

/**
 * Returns the calendar date (YYYY-MM-DD) for a given DayOfWeek in the current week (Mon-Sun)
 */
export function getDateForDayOfWeekInCurrentWeek(
  targetDay: TimetableEntry['dayOfWeek'],
  referenceDate: Date = new Date()
): string {
  const daysOrder: TimetableEntry['dayOfWeek'][] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  // Calculate relative to Monday as week start
  const currentDayIndex = (referenceDate.getDay() + 6) % 7;
  const targetDayIndex = daysOrder.indexOf(targetDay);
  const diffDays = targetDayIndex - currentDayIndex;

  const d = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + diffDays
  );
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates duration in minutes between "HH:MM" and "HH:MM"
 */
export function calculateMinutesBetween(startTime: string, endTime: string): number {
  try {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : 90;
  } catch {
    return 90;
  }
}

/**
 * Computes an "HH:MM" end time from a start time and duration minutes
 */
export function computeEndTime(startTime: string, durationMinutes: number = 90): string {
  try {
    const [sh, sm] = startTime.split(':').map(Number);
    const totalMin = sh * 60 + sm + durationMinutes;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  } catch {
    return '18:00';
  }
}

/**
 * Returns the default color code for a subject
 */
export function getSubjectColorKey(subjectName: string): string {
  const lower = subjectName.toLowerCase();
  if (lower.includes('math')) return 'indigo';
  if (lower.includes('physic')) return 'cyan';
  if (lower.includes('chem')) return 'purple';
  if (lower.includes('bio')) return 'emerald';
  if (lower.includes('ict') || lower.includes('info')) return 'pink';
  if (lower.includes('english') || lower.includes('git')) return 'blue';
  return 'amber';
}
