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

// ---------------------------------------------------------------------------
// Real Web Push subscription (free: browser vendor push service + VAPID).
// Call AFTER permission is granted. Reads the session internally so callers
// (e.g. NotificationPermissionModal) don't need prop drilling.
// Requires VITE_VAPID_PUBLIC_KEY in .env.
// ---------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    isNotificationSupported()
  );
}

/**
 * Subscribe this browser/device for closed-app push and save it to Supabase.
 * Safe to call repeatedly: reuses the existing subscription and upserts.
 * Returns true when a subscription is stored.
 */
export async function subscribeForPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!publicKey) {
      console.warn('[Push] VITE_VAPID_PUBLIC_KEY is not set. Skipping push subscription.');
      return false;
    }

    const { supabase } = await import('./supabaseClient');
    if (!supabase) return false;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return false;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh;
    const authKey = json.keys?.auth;
    if (!p256dh || !authKey) return false;

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh,
        auth: authKey,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'user_id,endpoint' }
    );
    if (error) {
      console.warn('[Push] Failed to save subscription:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Push] subscribeForPush failed:', err);
    return false;
  }
}

/**
 * Best-effort cleanup for revoked/denied permission.
 * If the browser permission is no longer granted but a push subscription for
 * this device still exists (e.g. the student revoked it in browser settings),
 * unsubscribe it and delete its row so the server stops sending dead pushes.
 * No-op when permission is still granted or no subscription exists.
 */
export async function cleanupStalePushSubscription(): Promise<void> {
  try {
    if (!isPushSupported()) return;
    if (Notification.permission === 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => undefined);
    const { supabase } = await import('./supabaseClient');
    if (!supabase) return;
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (err) {
    console.warn('[Push] cleanupStalePushSubscription failed:', err);
  }
}

/**
 * Remove this device's push subscription (call on logout / settings opt-out).
 */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!isPushSupported()) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    const endpoint = sub?.endpoint;
    if (sub) await sub.unsubscribe().catch(() => undefined);
    if (!endpoint) return;
    const { supabase } = await import('./supabaseClient');
    if (!supabase) return;
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (err) {
    console.warn('[Push] unsubscribeFromPush failed:', err);
  }
}

/**
 * Listen for subscription-rotation notices from the service worker
 * (pushsubscriptionchange). Re-subscribes so push_subscriptions keeps the
 * fresh endpoint. Call once at app startup.
 */
export function listenForPushSubscriptionChange(): void {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_SUBSCRIPTION_CHANGE') {
        if (Notification.permission === 'granted') {
          void subscribeForPush().catch(() => undefined);
        }
      }
    });
  } catch (err) {
    console.warn('[Push] listenForPushSubscriptionChange failed:', err);
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
