import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  try {
    const expectedSecret = Deno.env.get("MOOD_REMINDER_SECRET");
    if (expectedSecret) {
      const suppliedSecret = req.headers.get("x-cron-secret");
      if (suppliedSecret !== expectedSecret) return jsonResponse({ error: "Unauthorized" }, 401);
    }

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
    const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id,user_id,couple_id,subscription")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    let checked = 0;
    let sent = 0;

    for (const sub of subscriptions || []) {
      checked += 1;
      const { data: status } = await supabase
        .from("couple_status")
        .select("updated_at,mood_label")
        .eq("couple_id", sub.couple_id)
        .eq("user_id", sub.user_id)
        .maybeSingle();

      const isStale = !status?.updated_at || new Date(status.updated_at).getTime() < new Date(staleBefore).getTime();
      if (!isStale) continue;

      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify({
          title: "MoodSync",
          body: "Jak se dnes cítíš? Aktualizuj náladu pro partnera/partnerku.",
          url: "/",
          tag: "daily-mood-reminder",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        }));
        sent += 1;
      } catch (err) {
        const statusCode = err?.statusCode || err?.status;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return jsonResponse({ success: true, checked, sent });
  } catch (err) {
    console.error("mood-daily-reminder error", err);
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
});
