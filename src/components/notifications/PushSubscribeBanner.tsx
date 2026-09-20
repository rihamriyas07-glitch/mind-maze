import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import {
  getNotificationPermissionStatus,
  isPushSupported,
} from '../../lib/notificationService';

/**
 * Floating tap-to-subscribe banner for EXISTING users.
 *
 * The one-time onboarding explainer modal fires only once per account, so
 * students who dismissed it (or joined before push existed) never get asked
 * again. This banner closes that gap: it re-appears for signed-in users
 * whose browser permission is still undecided ('default') or blocked
 * ('denied'), and one tap opens the existing permission explainer modal —
 * the native browser prompt still fires ONLY from an explicit tap inside
 * that modal, never automatically.
 *
 * - 'default'  → "Turn on study reminders" CTA button.
 * - 'denied'   → no button can work (browser blocks re-prompts); shows how
 *                to re-enable in site settings instead.
 * - 'granted' / 'unsupported' → renders nothing (silent heal covers granted).
 *
 * Dismissal snoozes for 7 days under a versioned key, so bumping the key
 * suffix re-prompts everyone exactly once after major notification upgrades.
 */
interface PushSubscribeBannerProps {
  /** App-level permission state (re-render trigger); live value is re-read. */
  permission: NotificationPermission | 'unsupported';
  /** Opens the NotificationPermissionModal (explicit user tap chain). */
  onEnable: () => void;
}

const DISMISS_KEY = 'mindmaze_push_banner_dismissed_v2';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function isSnoozed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < SNOOZE_MS;
  } catch {
    return false;
  }
}

export const PushSubscribeBanner: React.FC<PushSubscribeBannerProps> = ({
  permission,
  onEnable,
}) => {
  const [snoozed, setSnoozed] = useState<boolean>(() => isSnoozed());
  const [live, setLive] = useState<NotificationPermission | 'unsupported'>(permission);

  // Re-read the real browser permission on focus: the student may have
  // granted/blocked it in site settings and returned to the tab.
  useEffect(() => {
    setLive(getNotificationPermissionStatus());
    const refresh = () => setLive(getNotificationPermissionStatus());
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [permission]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setSnoozed(true);
  }, []);

  if (!isPushSupported()) return null;
  if (snoozed) return null;
  if (live === 'granted' || live === 'unsupported') return null;

  const blocked = live === 'denied';

  return (
    <div
      id="push-subscribe-banner"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-2xl border border-emerald-400/40 bg-[#161831]/95 p-4 shadow-2xl backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-label="Study reminders"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#6B4EFF] to-cyan-400 text-white shrink-0 shadow-md">
          {blocked ? <BellOff className="w-5 h-5 text-white" /> : <Bell className="w-5 h-5 text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white">
            {blocked ? 'Reminders are blocked' : 'Turn on study reminders'}
          </p>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {blocked
              ? 'You blocked notifications for this site. Re-enable them in your browser\u2019s site settings (lock icon → Notifications → Allow), then reopen the app.'
              : 'Get 15-minute pre-alerts, streak protection, and the daily countdown — even with the app closed.'}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            {!blocked && (
              <button
                onClick={onEnable}
                id="btn-banner-enable-notifications"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6B4EFF] to-[#8B5CF6] hover:from-[#7C5DFA] hover:to-[#9D74FF] text-xs font-bold text-white shadow-lg transition cursor-pointer min-h-[44px]"
              >
                Enable reminders
              </button>
            )}
            <button
              onClick={dismiss}
              className="px-2.5 py-2 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition cursor-pointer min-h-[44px]"
            >
              {blocked ? 'Dismiss' : 'Later'}
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss reminders banner"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Dismiss for 7 days"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
