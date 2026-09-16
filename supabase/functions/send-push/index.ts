// Mind Maze — free Web Push sender (Supabase Edge Function, Deno).
// Deploy: supabase functions deploy send-push
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
// Schedule: pg_cron every 15 min -> SELECT net.http_post(...) to this function URL
//   with service-role key. Manual test: POST {"dryRun": true} or {"testUserId": "<uuid>"}.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@mindmaze.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- WhatsApp daily quiz reminder (separate notification type) ---
// Twice daily in Sri Lanka time (UTC+5:30): noon + 5pm. Cron ticks every
// 15 min, so each window below is 15 min wide and deduped per day.
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb8OnJGCRs1fpYosgU1z";
const WHATSAPP_QUIZ_ICON = "https://mind-maze-mu.vercel.app/bell.jpeg";
const SL_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

async function alreadySent(supabase: any, userId: string, dedupeKey: string): Promise<boolean> {
  const { data } = await supabase
    .from("push_sent_log")
    .select("dedupe_key")
    .eq("user_id", userId)
    .eq("dedupe_key", dedupeKey)
    .maybeSingle();
  return !!data;
}

async function markSent(supabase: any, userId: string, kind: string, dedupeKey: string) {
  await supabase.from("push_sent_log").upsert(
    { user_id: userId, kind, dedupe_key: dedupeKey },
    { onConflict: "user_id,dedupe_key" },
  );
}

async function sendToUser(supabase: any, userId: string, payload: object) {
  const { data: subs } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId);
  if (!subs?.length) return 0;
  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      ok++;
    } catch (e: any) {
      // 404/410 = subscription expired or revoked: clean it so future sends stay fast.
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", s.endpoint);
      } else {
        console.warn("push send failed", e?.statusCode ?? e?.message);
      }
    }
  }
  return ok;
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date();
  const hour = now.getHours();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dayName = DAY_NAMES[now.getDay()];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let body: any = {};
  try {
    body = await req.json();
  } catch { /* GET / cron without body */ }

  // --- Manual test: POST {"testUserId":"<uuid>"} sends one push immediately ---
  if (body?.testUserId) {
    const n = await sendToUser(supabase, body.testUserId, {
      title: "🔔 Mind Maze test push",
      body: "Closed-app push works! This arrived without any open tab.",
      tag: "mind-maze-test",
      url: "/",
    });
    return Response.json({ ok: true, sentToSubscriptions: n });
  }

  // Quiet hours: never push 22:00–08:00 (matches your in-app nudge rules).
  if (hour < 8 || hour >= 22) {
    return Response.json({ ok: true, skipped: "quiet-hours" });
  }

  let sent = 0;

  // --- 1. Timetable pre-alerts due in the last 15-min window ---
  const { data: slots } = await supabase
    .from("timetable_entries")
    .select("user_id, id, subject, topic, start_time, reminder_offset_minutes")
    .eq("day_of_week", dayName)
    .eq("reminder_enabled", true);

  for (const s of slots ?? []) {
    const target = toMinutes(s.start_time) - (s.reminder_offset_minutes ?? 15);
    const minsAgo = nowMin - target;
    if (minsAgo < 0 || minsAgo > 15) continue; // due within this cron tick
    const dedupe = `tt:${s.id}:${todayStr}:${target}`;
    if (await alreadySent(supabase, s.user_id, dedupe)) continue;
    const n = await sendToUser(supabase, s.user_id, {
      title: `📚 ${s.subject} in ${s.reminder_offset_minutes ?? 15} min`,
      body: `${s.topic} (${s.start_time}) — gather your past papers!`,
      tag: dedupe,
      url: "/",
    });
    if (n > 0) {
      await markSent(supabase, s.user_id, "timetable", dedupe);
      sent += n;
    }
  }

  // --- 2. Daily streak-nudge: one per day for users with incomplete tasks ---
  // (Keeps it cheap: one cron pass, one push per user per day max.)
  const { data: tasks } = await supabase
    .from("daily_tasks")
    .select("user_id")
    .eq("date", todayStr)
    .eq("is_completed", false);
  const usersWithIncomplete = [...new Set((tasks ?? []).map((t: any) => t.user_id))];
  for (const userId of usersWithIncomplete) {
    const dedupe = `nudge:${todayStr}`;
    if (await alreadySent(supabase, userId, dedupe)) continue;
    const n = await sendToUser(supabase, userId, {
      title: "🔥 Protect your streak",
      body: "You still have unfinished topics today. A short session keeps the streak alive!",
      tag: dedupe,
      url: "/",
    });
    if (n > 0) {
      await markSent(supabase, userId, "nudge", dedupe);
      sent += n;
    }
  }

  // --- 3. WhatsApp daily quiz reminder: 12:00 & 17:00 Sri Lanka time ---
  // Applies to ALL subscribed students (not tied to timetable/streak).
  // Window check uses SL wall-clock time so deploy-region timezone can't shift it.
  const slNow = new Date(now.getTime() + SL_OFFSET_MS);
  const slTodayStr = slNow.toISOString().slice(0, 10); // YYYY-MM-DD in SL time
  const slNowMin = slNow.getUTCHours() * 60 + slNow.getUTCMinutes();
  let quizSlot: "noon" | "evening" | null = null;
  if (slNowMin >= 12 * 60 && slNowMin < 12 * 60 + 15) quizSlot = "noon";
  else if (slNowMin >= 17 * 60 && slNowMin < 17 * 60 + 15) quizSlot = "evening";

  if (quizSlot) {
    const dedupe = `whatsapp-quiz-${quizSlot}-${slTodayStr}`;
    const payload = quizSlot === "noon"
      ? {
        title: "📢 Today's quiz is up!",
        body: "Check the WhatsApp channel now — today's quiz is waiting for you!",
        tag: dedupe,
        url: WHATSAPP_CHANNEL_URL,
        icon: WHATSAPP_QUIZ_ICON,
      }
      : {
        title: "📢 Evening quiz reminder!",
        body: "Haven't tried today's quiz yet? Tap to open the WhatsApp channel!",
        tag: dedupe,
        url: WHATSAPP_CHANNEL_URL,
        icon: WHATSAPP_QUIZ_ICON,
      };
    const { data: allSubs } = await supabase.from("push_subscriptions").select("user_id");
    const allUserIds = [...new Set((allSubs ?? []).map((s: any) => s.user_id))];
    for (const userId of allUserIds) {
      if (await alreadySent(supabase, userId, dedupe)) continue;
      const n = await sendToUser(supabase, userId, payload);
      if (n > 0) {
        await markSent(supabase, userId, "whatsapp_quiz", dedupe);
        sent += n;
      }
    }
  }

  return Response.json({ ok: true, sent, dryRun: body?.dryRun ?? false });
});
