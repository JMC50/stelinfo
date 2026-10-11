import { getChatChannelId, getPendingDebutChannelId } from "./chzzkBroadcast";

export interface SubscriptionBadge {
    imageUrl: string;
    title: string;
}

// Covers both CHANNEL-scoped badges (donation milestones, "founder"-style
// first-N-subscribers badges, subscription-gifting badges, ...) and
// GLOBAL ones (platform-wide badges unrelated to any one streamer) — same
// shape either way, so no need to special-case by badge type.
export interface ViewerBadge {
    badgeId: string;
    imageUrl: string;
    title: string;
    description: string | null;
    scope: string;
}

export interface FollowSubscribeInfo {
    followDate: string | null;
    subscribeMonths: number;
    subscriptionBadge: SubscriptionBadge | null;
    badges: ViewerBadge[];
}

// Unlike the live-detail/videos endpoints, this one isn't WAF-gated and
// needs no session cookie at all — it's the same "profile card" data any
// viewer can see by clicking a nickname in that streamer's chat, keyed by
// the target user's own Chzzk id (userIdHash === the OAuth `channelId` we
// already have for the logged-in user).
const PROFILE_CARD_URL = (chatChannelId: string, userIdHash: string) =>
    `https://comm-api.game.naver.com/nng_main/v1/chats/${chatChannelId}/users/${userIdHash}/profile-card?chatType=STREAMING`;

// Fallback for members with no chatChannelId yet (see
// getPendingDebutChannelId in chzzkBroadcast.ts). This endpoint variant
// resolves the channel from `streamingChannelId` instead of the path
// segment, and doesn't validate the path segment at all — confirmed by
// hand against both a never-streamed channel and a live one. Undocumented
// behavior, so treat this as temporary.
const PENDING_DEBUT_PROFILE_URL = (streamingChannelId: string, userIdHash: string) =>
    `https://comm-api.game.naver.com/nng_main/v1/chats/pending/users/${userIdHash}/profile?streamingChannelId=${streamingChannelId}&chatType=STREAMING`;

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: FollowSubscribeInfo | null; expiresAt: number }>();

export async function getFollowSubscribeInfo(
    stellarId: string,
    userIdHash: string
): Promise<FollowSubscribeInfo | null> {
    const cacheKey = `${stellarId}:${userIdHash}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const chatChannelId = getChatChannelId(stellarId);
    const pendingDebutChannelId = chatChannelId ? null : getPendingDebutChannelId(stellarId);
    const url = chatChannelId
        ? PROFILE_CARD_URL(chatChannelId, userIdHash)
        : pendingDebutChannelId
          ? PENDING_DEBUT_PROFILE_URL(pendingDebutChannelId, userIdHash)
          : null;
    let result: FollowSubscribeInfo | null = null;

    if (url) {
        const res = await fetch(url, {
            headers: {
                Accept: "application/json",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Referer: "https://chzzk.naver.com/"
            }
        });

        if (res.ok) {
            const body = await res.json();
            const content = body?.content;
            const streamingProperty = content?.streamingProperty;
            const rawSubscriptionBadge = streamingProperty?.subscription?.badge;
            // The subscription tier badge ("3개월", "1년", ...) lives under
            // streamingProperty.subscription and is never itself listed in
            // viewerBadges — it has to be pulled out separately. The
            // PENDING_DEBUT_PROFILE_URL fallback returns this with no
            // `title` at all, so fall back to the subscription's tierName
            // ("팬", ...), then a generic label, rather than dropping it.
            const subscriptionBadge: SubscriptionBadge | null = rawSubscriptionBadge?.imageUrl
                ? {
                      imageUrl: rawSubscriptionBadge.imageUrl,
                      title: rawSubscriptionBadge.title ?? streamingProperty?.subscription?.tierName ?? "구독"
                  }
                : null;
            // viewerBadges mixes badges the user owns but hasn't equipped
            // with ones they have — activatedV2 is that flag on the
            // /profile-card shape, so only surface those there. The
            // PENDING_DEBUT_PROFILE_URL fallback doesn't include
            // activatedV2 (or title/description) at all — there's no way
            // to tell equipped from unequipped there, so default to
            // showing everything rather than hiding real badges (e.g. a
            // "founder" badge) just because this endpoint variant is
            // missing the flag.
            const rawViewerBadges: unknown[] = Array.isArray(content?.viewerBadges) ? content.viewerBadges : [];
            const badges: ViewerBadge[] = rawViewerBadges
                .filter((b: any) => b?.activatedV2 !== false && b?.badge?.imageUrl)
                .map((b: any) => ({
                    badgeId: b.badge.badgeId,
                    imageUrl: b.badge.imageUrl,
                    title: b.badge.title ?? b.badge.badgeId,
                    description: b.badge.description ?? null,
                    scope: b.badge.scope
                }));

            result = {
                followDate: streamingProperty?.following?.followDate ?? null,
                subscribeMonths: streamingProperty?.subscription?.accumulativeMonth ?? 0,
                subscriptionBadge,
                badges
            };
        }
    }

    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
}
