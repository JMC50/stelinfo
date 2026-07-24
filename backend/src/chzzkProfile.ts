import { getChatChannelId } from "./chzzkBroadcast";

export interface FollowSubscribeInfo {
    followDate: string | null;
    subscribeMonths: number;
}

// Unlike the live-detail/videos endpoints, this one isn't WAF-gated and
// needs no session cookie at all — it's the same "profile card" data any
// viewer can see by clicking a nickname in that streamer's chat, keyed by
// the target user's own Chzzk id (userIdHash === the OAuth `channelId` we
// already have for the logged-in user).
const PROFILE_CARD_URL = (chatChannelId: string, userIdHash: string) =>
    `https://comm-api.game.naver.com/nng_main/v1/chats/${chatChannelId}/users/${userIdHash}/profile-card?chatType=STREAMING`;

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
    let result: FollowSubscribeInfo | null = null;

    if (chatChannelId) {
        const res = await fetch(PROFILE_CARD_URL(chatChannelId, userIdHash), {
            headers: {
                Accept: "application/json",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Referer: "https://chzzk.naver.com/"
            }
        });

        if (res.ok) {
            const body = await res.json();
            const streamingProperty = body?.content?.streamingProperty;
            result = {
                followDate: streamingProperty?.following?.followDate ?? null,
                subscribeMonths: streamingProperty?.subscription?.accumulativeMonth ?? 0
            };
        }
    }

    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
}
