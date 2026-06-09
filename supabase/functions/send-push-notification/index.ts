import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      coupleId,
      senderId,
      eventType = "moodsync_event",
      title = "MoodSync",
      body = "Máš nové upozornění.",
      url = "/",
    } = await req.json();

    if (!coupleId || !senderId) {
      return jsonResponse({ error: "Missing coupleId or senderId" }, 400);
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

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data: senderMembership, error: membershipError } = await supabase
      .from("couple_members")
      .select("couple_id,user_id")
      .eq("couple_id", coupleId)
      .eq("user_id", senderId)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!senderMembership) {
      return jsonResponse({ error: "Sender is not a member of this couple" }, 403);
    }

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id,user_id,subscription")
      .eq("couple_id", coupleId)
      .neq("user_id", senderId);

    if (error) throw error;

    const payload = JSON.stringify({
      title,
      body,
      url,
      tag: eventType,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });

    const results = await Promise.allSettled(
      (subscriptions || []).map(async (item) => {
        try {
          await webpush.sendNotification(item.subscription, payload);
          return { id: item.id, ok: true };
        } catch (err) {
          const statusCode = err?.statusCode || err?.status;
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", item.id);
          }

          console.error("Push failed", {
            subscriptionId: item.id,
            statusCode,
            message: err?.message || String(err),
          });

          return { id: item.id, ok: false, statusCode, message: err?.message || String(err) };
        }
      }),
    );

    return jsonResponse({
      success: true,
      sentTo: subscriptions?.length || 0,
      results,
    });
  } catch (err) {
    console.error("send-push-notification error", err);
    return jsonResponse({ error: err?.message || String(err) }, 500);
  }
});
