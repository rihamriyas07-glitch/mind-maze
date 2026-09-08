/**
 * Mind Maze Notification & Study Reminder Service
 */
import { TimetableEntry, DailyTask } from '../types';
import { generateSmartStudyReminder, generateDailyCountdown } from './notificationMessages';
import { getTodayDateString } from './storage';

const COUNTDOWN_SENT_KEY = 'mindmaze_countdown_sent_day';

let audioCtx: AudioContext | null = null;

export function playStudyChime(): void {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!audioCtx) return;

    // Synthesize a pleasant two-tone study chime: E5 -> B5
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.15); // B5
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.9);
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Notification permission request error:', e);
    return Notification.permission;
  }
}

/**
 * Register Service Worker if available.
 * Production only: registering during local development would let the worker
 * serve stale cached shells and block Vite's dev server / HMR traffic, so in
 * DEV we unregister any leftover workers and stay unregistered.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    if (import.meta.env.DEV) {
      const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.all(
        (regs ?? []).map((reg) => reg.unregister().catch(() => false))
      );
      return null;
    }
  } catch (err) {
    console.warn('Service worker dev cleanup failed:', err);
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Trigger a native system notification with fallback to audio chime
 */
export async function sendStudyNotification(
  title: string,
  body: string,
  icon = '/icon-192.png',
  tag = 'mind-maze-study-reminder'
): Promise<boolean> {
  // Always play gentle chime
  playStudyChime();

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try service worker showNotification first for PWA background reliability
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: '/icon-192.png',
          tag,
          renotify: true,
          vibrate: [200, 100, 200],
        } as NotificationOptions);
        return true;
      }
    }

    // Fallback to standard web notification
    new Notification(title, {
      body,
      icon,
      badge: '/icon-192.png',
      tag,
    });
    return true;
  } catch (err) {
    console.warn('Failed to dispatch notification:', err);
    return false;
  }
}

// Track alerted slot IDs so we don't spam duplicate alerts within the same minute
const alertedSlotIds = new Set<string>();

/**
 * Send the daily A/L countdown notification once each morning.
 *
 * Respects the existing setup: skipped entirely when notifications aren't
 * granted, outside 8:00–22:00 quiet hours, when no exam date is set, or
 * when the exam has passed. One send per calendar day max.
 */
export function maybeSendDailyCountdown(
  examDateStr: string | null | undefined,
  motivationNote?: string | null
): { sent: boolean; message?: string } {
  if (!examDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(examDateStr)) {
    return { sent: false };
  }
  const [y, m, d] = examDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  if (Number.isNaN(target.getTime())) return { sent: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((target.getTime() - today.getTime()) / 86400000);
  // Exam passed (yesterday or earlier) — nothing to count down to.
  if (daysLeft < 0) return { sent: false };

  // Morning send at/after 8 AM, never in quiet hours (10 PM - 8 AM).
  const hour = new Date().getHours();
  if (hour < 8 || hour >= 22) return { sent: false };

  // Permission gate — same requirement as every other notification.
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return { sent: false };
  }

  // Once per calendar day.
  const todayStr = getTodayDateString();
  try {
    if (localStorage.getItem(COUNTDOWN_SENT_KEY) === todayStr) {
      return { sent: false };
    }
  } catch {
    return { sent: false };
  }

  const msg = generateDailyCountdown({ daysLeft, motivationNote });
  if (!msg) return { sent: false };

  void sendStudyNotification(msg.title, msg.body, '/icon-192.png', 'mind-maze-countdown');
  try {
    localStorage.setItem(COUNTDOWN_SENT_KEY, todayStr);
  } catch {}
  return { sent: true, message: `${msg.title}: ${msg.body}` };
}

/**
 * Check timetable entries against current local time and trigger smart contextual reminders
 */
export function checkTimetableReminders(
  entries: TimetableEntry[],
  currentDay: TimetableEntry['dayOfWeek'],
  options?: {
    dailyTasks?: DailyTask[];
    currentStreak?: number;
    onReminderTriggered?: (entry: TimetableEntry, msg: string) => void;
  }
): void {
  const now = new Date();
  const currentMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const todayStr = getTodayDateString();

  const dailyTasks = options?.dailyTasks || [];
  const currentStreak = options?.currentStreak ?? 0;
  const todayTasks = dailyTasks.filter((t) => t.date === todayStr);
  const totalTodayTasks = todayTasks.length;
  const completedTodayTasks = todayTasks.filter((t) => t.isCompleted).length;
  const remainingTodayTasks = totalTodayTasks - completedTodayTasks;

  for (const entry of entries) {
    if (!entry.reminderEnabled) continue;
    if (entry.dayOfWeek !== currentDay) continue;

    const [startH, startM] = entry.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;

    // Calculate target reminder time in minutes
    const reminderTargetMinutes = startMinutes - (entry.reminderOffsetMinutes || 0);

    // If current time matches within 1-minute window
    if (Math.abs(currentMinutesSinceMidnight - reminderTargetMinutes) <= 1) {
      const alertKey = `${entry.id}-${now.toDateString()}-${reminderTargetMinutes}`;
      if (!alertedSlotIds.has(alertKey)) {
        alertedSlotIds.add(alertKey);

        const timeContext =
          entry.reminderOffsetMinutes === 0
            ? 'Starting right now'
            : `Starting in ${entry.reminderOffsetMinutes} minutes (${entry.startTime} - ${entry.endTime})`;

        // Generate contextual, motivational reminder message
        const smartMsg = generateSmartStudyReminder({
          subject: entry.subject,
          topicTitle: entry.topic,
          subtopic: entry.subtopic,
          timeContext,
          currentStreak,
          totalTodayTasks,
          completedTodayTasks,
          remainingTodayTasks,
          currentHour: now.getHours(),
        });

        sendStudyNotification(smartMsg.title, smartMsg.body);

        if (options?.onReminderTriggered) {
          options.onReminderTriggered(entry, `${smartMsg.title}: ${smartMsg.body}`);
        }
      }
    }
  }
}
