import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const PRAGUE_TIME_ZONE = "Europe/Prague";
const DAY_MS = 24 * 60 * 60 * 1000;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pragueDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

function twoDayPeriodKey(date = new Date()) {
  return String(Math.floor(date.getTime() / (2 * DAY_MS)));
}

function threeDayPeriodKey(date = new Date()) {
  return String(Math.floor(date.getTime() / (3 * DAY_MS)));
}

function isSamePragueDay(timestamp: string | null | undefined, todayKey: string) {
  if (!timestamp) return false;
  return pragueDateKey(new Date(timestamp)) === todayKey;
}

function isOlderThan(timestamp: string | null | undefined, hours: number) {
  if (!timestamp) return true;
  return Date.now() - new Date(timestamp).getTime() > hours * 60 * 60 * 1000;
}

async function reserveNotification(supabase: any, userId: string, coupleId: string, eventType: string, periodKey: string) {
  const { error } = await supabase
    .from("push_notification_log")
    .insert({ user_id: userId, couple_id: coupleId, event_type: eventType, period_key: periodKey });

  if (!error) return true;
  if (String(error.code) === "23505" || String(error.message || "").includes("duplicate key")) return false;
  throw error;
}

async function sendPush(supabase: any, subscriptionRow: any, payload: Record<string, unknown>, options: Record<string, unknown> = {}) {
  try {
    await webpush.sendNotification(subscriptionRow.subscription, JSON.stringify({
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      timestamp: Date.now(),
      ...payload,
    }), {
      TTL: 60 * 60 * 6,
      urgency: "normal",
      ...options,
    });
    return true;
  } catch (err) {
    const statusCode = err?.statusCode || err?.status;
    if (statusCode === 404 || statusCode === 410) {
      await supabase.from("push_subscriptions").delete().eq("id", subscriptionRow.id);
    }
    console.error("Scheduled push failed", {
      subscriptionId: subscriptionRow.id,
      endpoint: subscriptionRow.endpoint,
      statusCode,
      message: err?.message || String(err),
    });
    return false;
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

    const expectedSecret = Deno.env.get("MOOD_REMINDER_SECRET");
    if (!expectedSecret) return jsonResponse({ error: "MOOD_REMINDER_SECRET is not configured" }, 500);
    const suppliedSecret = req.headers.get("x-cron-secret");
    if (suppliedSecret !== expectedSecret) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
      return jsonResponse({ error: "Missing Supabase or VAPID secrets" }, 500);
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const todayKey = pragueDateKey();
    const inactive48Key = twoDayPeriodKey();
    const inactive72Key = threeDayPeriodKey();
    const since48 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const since72 = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id,user_id,couple_id,endpoint,subscription")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    let checked = 0;
    let sent = 0;
    let skipped = 0;
    const perUser = new Map<string, any[]>();

    for (const sub of subscriptions || []) {
      const userSubscriptions = perUser.get(sub.user_id) || [];
      userSubscriptions.push(sub);
      perUser.set(sub.user_id, userSubscriptions);
    }

    for (const userSubscriptions of perUser.values()) {
      const sub = userSubscriptions[0];
      checked += 1;

      const { data: status } = await supabase
        .from("couple_status")
        .select("updated_at,mood_label,heat,closeness")
        .eq("couple_id", sub.couple_id)
        .eq("user_id", sub.user_id)
        .maybeSingle();

      const { data: lastOwnPost } = await supabase
        .from("posts")
        .select("created_at,type")
        .eq("couple_id", sub.couple_id)
        .eq("author_id", sub.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lastCouplePost } = await supabase
        .from("posts")
        .select("created_at,type")
        .eq("couple_id", sub.couple_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: todaysMoment } = await supabase
        .from("daily_moments")
        .select("id")
        .eq("couple_id", sub.couple_id)
        .eq("author_id", sub.user_id)
        .eq("moment_date", todayKey)
        .maybeSingle();

      const thermometerFilledToday = isSamePragueDay(status?.updated_at, todayKey);
      const momentUploadedToday = Boolean(todaysMoment?.id);
      const ownInactive48h = isOlderThan(status?.updated_at, 48) && isOlderThan(lastOwnPost?.created_at, 48);
      const coupleQuiet72h = isOlderThan(lastCouplePost?.created_at, 72);

      let candidate: null | { eventType: string; periodKey: string; payload: Record<string, unknown>; options?: Record<string, unknown> } = null;

      if (!momentUploadedToday) {
        candidate = {
          eventType: "daily_moment_reminder",
          periodKey: todayKey,
          payload: {
            title: "MoodSync Dnešní moment",
            body: "Potěš a vzruš svého partnera nebo partnerku — pošli dnešní fotku či krátké video.",
            url: "/?tab=moments",
            tag: "daily-moment-reminder",
          },
          options: { TTL: 60 * 60 * 12, urgency: "normal" },
        };
      } else if (!thermometerFilledToday) {
        candidate = {
          eventType: "daily_thermometer_reminder",
          periodKey: todayKey,
          payload: {
            title: "MoodSync teploměr",
            body: "Jak jsi na tom dnes? Doplň blízkost a nadrženost, ať má partner/ka aktuální signál.",
            url: "/?tab=home",
            tag: "daily-thermometer-reminder",
          },
          options: { TTL: 60 * 60 * 12, urgency: "normal" },
        };
      } else if (ownInactive48h) {
        candidate = {
          eventType: "inactive_48h_nudge",
          periodKey: inactive48Key,
          payload: {
            title: "MoodSync jemné připomenutí",
            body: "V appce je poslední dobou ticho. Pošli partnerovi/partnerce rychlou zprávu nebo aktualizuj náladu.",
            url: "/?tab=chat",
            tag: "inactive-48h-nudge",
          },
          options: { TTL: 60 * 60 * 24, urgency: "low" },
        };
      } else if (coupleQuiet72h) {
        candidate = {
          eventType: "couple_quiet_72h_nudge",
          periodKey: inactive72Key,
          payload: {
            title: "MoodSync spojení",
            body: "Dlouho jste si nic neposlali. Co dnes jedna věta, kompliment nebo malý plán na večer?",
            url: "/?tab=chat",
            tag: "couple-quiet-72h-nudge",
          },
          options: { TTL: 60 * 60 * 24, urgency: "low" },
        };
      }

      if (!candidate) {
        skipped += 1;
        continue;
      }

      const reserved = await reserveNotification(supabase, sub.user_id, sub.couple_id, candidate.eventType, candidate.periodKey);
      if (!reserved) {
        skipped += 1;
        continue;
      }

      const deliveryResults = await Promise.all(
        userSubscriptions.map((subscription) => sendPush(supabase, subscription, candidate.payload, candidate.options)),
      );
      const delivered = deliveryResults.filter(Boolean).length;
      sent += delivered;

      // A failed delivery must not consume the idempotency reservation forever.
      if (!delivered) {
        await supabase
          .from("push_notification_log")
          .delete()
          .eq("user_id", sub.user_id)
          .eq("event_type", candidate.eventType)
          .eq("period_key", candidate.periodKey);
      }
    }

    return jsonResponse({ success: true, checked, sent, skipped, uniqueUsers: perUser.size, todayKey });
  } catch (err) {
    console.error("mood-daily-reminder error", err);
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
});
