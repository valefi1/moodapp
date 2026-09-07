import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REDGIFS_API_URL = "https://api.redgifs.com/v2";
const MAX_QUERY_LENGTH = 80;
const MAX_RESULT_COUNT = 20;
const UPSTREAM_TIMEOUT_MS = 10_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeRedgifsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || (hostname !== "redgifs.com" && !hostname.endsWith(".redgifs.com"))) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function safeRedgifsEmbedUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || (hostname !== "redgifs.com" && hostname !== "www.redgifs.com")) {
      return null;
    }
    if (!/^\/ifr\/[a-z0-9]+\/?$/i.test(url.pathname)) return null;
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function sanitizeGif(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const gif = value as Record<string, unknown>;
  const urls = gif.urls && typeof gif.urls === "object" ? gif.urls as Record<string, unknown> : {};
  const externalId = typeof gif.id === "string" && /^[a-z0-9]+$/i.test(gif.id) ? gif.id : null;
  const mediaUrl = safeRedgifsUrl(urls.hd)
    || safeRedgifsUrl(urls.sd)
    || safeRedgifsUrl(urls.webm)
    || safeRedgifsUrl(urls.mp4);
  const thumbnailUrl = safeRedgifsUrl(urls.thumbnail) || safeRedgifsUrl(urls.poster);
  const embedUrl = safeRedgifsEmbedUrl(urls.html);

  if (!externalId || (!mediaUrl && !thumbnailUrl && !embedUrl)) return null;

  return {
    externalId,
    sourceUrl: `https://www.redgifs.com/watch/${externalId.toLowerCase()}`,
    mediaUrl,
    thumbnailUrl,
    embedUrl,
    tags: Array.isArray(gif.tags) ? gif.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 20) : [],
    duration: finiteNumber(gif.duration),
    width: positiveInteger(gif.width),
    height: positiveInteger(gif.height),
  };
}

function relevanceScore(gif: ReturnType<typeof sanitizeGif>, query: string) {
  if (!gif) return -1;
  const terms = query.toLocaleLowerCase().split(/[^a-z0-9áčďéěíňóřšťúůýž]+/i).filter(Boolean);
  return terms.reduce((score, term) => score + gif.tags.reduce((tagScore, tag) => {
    const normalizedTag = tag.toLocaleLowerCase();
    return tagScore + (normalizedTag === term ? 5 : normalizedTag.includes(term) ? 2 : 0);
  }, 0), 0);
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`RedGIFs request failed (${response.status})`);
  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("redgifs-search: missing Supabase environment variables");
      return jsonResponse({ error: "Server configuration is incomplete" }, 500);
    }

    const authorization = req.headers.get("authorization");
    if (!authorization?.toLowerCase().startsWith("bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const jwt = authorization.slice(7).trim();
    const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(jwt);
    const userId = authData.user?.id;
    if (authError || !userId) return jsonResponse({ error: "Unauthorized" }, 401);

    let parsedBody: unknown;
    try {
      parsedBody = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    const body = parsedBody as Record<string, unknown>;

    const coupleId = typeof body.coupleId === "string" ? body.coupleId.trim() : "";
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const count = body.count === undefined ? 12 : body.count;

    if (!coupleId) return jsonResponse({ error: "Missing coupleId" }, 400);
    if (query.length < 2 || query.length > MAX_QUERY_LENGTH) {
      return jsonResponse({ error: "Query must contain 2 to 80 characters" }, 400);
    }
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > MAX_RESULT_COUNT) {
      return jsonResponse({ error: "Count must be an integer from 1 to 20" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: membership, error: membershipError } = await adminClient
      .from("couple_members")
      .select("couple_id")
      .eq("couple_id", coupleId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) {
      console.error("redgifs-search: membership lookup failed", membershipError.message);
      return jsonResponse({ error: "Membership could not be verified" }, 500);
    }
    if (!membership) return jsonResponse({ error: "Forbidden" }, 403);

    const tokenPayload = await fetchJson(`${REDGIFS_API_URL}/auth/temporary?path=%2Fsearch`, {
      headers: { Accept: "application/json" },
    });
    const temporaryToken = tokenPayload && typeof tokenPayload.token === "string" ? tokenPayload.token : null;
    if (!temporaryToken) throw new Error("RedGIFs did not return a temporary token");

    const searchUrl = new URL(`${REDGIFS_API_URL}/gifs/search`);
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("order", "score");
    searchUrl.searchParams.set("page", "1");
    searchUrl.searchParams.set("count", String(count));
    const searchPayload = await fetchJson(searchUrl.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${temporaryToken}`,
        Origin: "https://www.redgifs.com",
        Referer: "https://www.redgifs.com/",
      },
    });

    const results = (Array.isArray(searchPayload?.gifs) ? searchPayload.gifs : [])
      .map(sanitizeGif)
      .filter((gif): gif is NonNullable<ReturnType<typeof sanitizeGif>> => Boolean(gif))
      .sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query))
      .slice(0, count);

    return jsonResponse({ results });
  } catch (error) {
    console.error("redgifs-search failed", error instanceof Error ? error.message : "Unknown error");
    return jsonResponse({ error: "GIF search is temporarily unavailable" }, 502);
  }
});
