import webpush from "web-push";
import { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } from "./config";
import { deleteSubscription, getSubscribersForStellar, type PushSubscriptionRow } from "./pushSubscriptions";
import { getStreamerInfo } from "./streamerInfo";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface BroadcastStartedEvent {
    stellarId: string;
    title: string;
    url: string;
    startedAt: string;
}

function toWebPushSubscription(row: PushSubscriptionRow): webpush.PushSubscription {
    return { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
}

// chzzk.naver.com/live/{channelId} -> {channelId}. event.url already carries
// this (see stellar_status/src/chzzkCapture.ts), so there's no separate
// channelId mapping to maintain here.
function extractChzzkChannelId(chzzkUrl: string): string | null {
    const match = chzzkUrl.match(/chzzk\.naver\.com\/live\/([a-z0-9]+)/i);
    return match?.[1] ?? null;
}

interface ChannelImageCacheEntry {
    url: string;
    fetchedAt: number;
}

// Profile photos barely ever change, so a long TTL keeps this to roughly one
// request per streamer per broadcast rather than one per notification send.
const CHANNEL_IMAGE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CHANNEL_IMAGE_FETCH_TIMEOUT_MS = 4000;
const channelImageCache = new Map<string, ChannelImageCacheEntry>();

/**
 * That stellar's real chzzk profile picture, straight from chzzk's own
 * (unauthenticated, WAF-unblocked) channel-info endpoint. Falls back to
 * `null` on any failure -- a slow/unreachable chzzk should never stop a
 * notification from going out with a fallback icon.
 */
async function getChzzkChannelImage(channelId: string): Promise<string | null> {
    const cached = channelImageCache.get(channelId);
    if (cached && Date.now() - cached.fetchedAt < CHANNEL_IMAGE_CACHE_TTL_MS) {
        return cached.url;
    }

    try {
        const res = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(CHANNEL_IMAGE_FETCH_TIMEOUT_MS)
        });
        if (!res.ok) return cached?.url ?? null;

        const body = (await res.json()) as { content?: { channelImageUrl?: string } };
        const url = body.content?.channelImageUrl;
        if (typeof url !== "string" || !url) return cached?.url ?? null;

        channelImageCache.set(channelId, { url, fetchedAt: Date.now() });
        return url;
    } catch (err) {
        console.error(`chzzk channel image fetch failed for ${channelId}:`, err);
        return cached?.url ?? null;
    }
}

// How long the push service should hold a notification for a
// currently-unreachable device (PC asleep/off, phone offline) before giving
// up on it. Without this, the default TTL is effectively "hold indefinitely",
// so turning a PC back on hours later dumps every stale "방송 시작" alert at
// once -- a "방금 켰다"-style notification for a stream that started long
// ago isn't useful, so it's better dropped than delivered late.
const NOTIFICATION_TTL_SECONDS = 10 * 60;

/**
 * Sends `payload` to every given subscription. Expired/invalid ones
 * (410/404 — the browser or user revoked them) are pruned as they're
 * discovered; anything else just gets logged, since a single subscriber's
 * failure shouldn't stop the rest.
 */
async function sendToSubscribers(subscribers: PushSubscriptionRow[], payload: string): Promise<void> {
    if (subscribers.length === 0) return;

    const results = await Promise.allSettled(
        subscribers.map((sub) =>
            webpush.sendNotification(toWebPushSubscription(sub), payload, { TTL: NOTIFICATION_TTL_SECONDS })
        )
    );

    results.forEach((result, i) => {
        if (result.status === "fulfilled") return;
        const sub = subscribers[i]!;
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
            deleteSubscription(sub.endpoint);
        } else {
            console.error(`push send failed for ${sub.endpoint}:`, result.reason);
        }
    });
}

/** Fans a "방송 시작" notification out to everyone subscribed to this stellar. */
export async function sendBroadcastStartedNotification(event: BroadcastStartedEvent): Promise<void> {
    const subscribers = getSubscribersForStellar(event.stellarId);
    const memberName = getStreamerInfo(event.stellarId)?.memberName ?? event.stellarId;

    const channelId = extractChzzkChannelId(event.url);
    const chzzkImage = channelId ? await getChzzkChannelImage(channelId) : null;
    // Falls back to our own stored avatar if chzzk's endpoint is slow/down
    // or the URL didn't parse -- filenames mirror
    // frontend/src/lib/data/stellars.ts.
    const icon = chzzkImage ?? `/images/stellars/${event.stellarId}.webp`;

    const payload = JSON.stringify({
        title: `${memberName} 방송 시작!`,
        body: event.title,
        // event.url is the real chzzk.naver.com/live/... link the webhook
        // sent (see stellar_status/src/chzzkCapture.ts) -- clicking the
        // notification should drop the viewer straight into the stream,
        // not onto our own follow/subscribe info page.
        url: event.url,
        icon
    });
    await sendToSubscribers(subscribers, payload);
}
