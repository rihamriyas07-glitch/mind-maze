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

  return Response.json({ ok: true, sent, dryRun: body?.dryRun ?? false });
});
