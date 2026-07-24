import { chromium, type Browser } from "playwright";

// Real chzzk channel ids per stellar (same values as frontend/src/lib/data/stellars.ts's
// links.chzzk URLs).
const stellarChannelIds: Record<string, string> = {
    Gangzi: "b5ed5db484d04faf4d150aedd362f34b",
    Ayatsuno_yuni: "45e71a76e949e16a34764deb962f9d9f",
    Sakihane_huya: "36ddb9bb4f17593b60f1b63cec86611d",
    Shirayuki_hina: "b044e3a3b9259246bc92e863e7d3f3b8",
    Neneko_mashiro: "4515b179f86b67b4981e16190817c580",
    Akane_lize: "4325b1d5bbc321fad3042306646e2e50",
    Arahashi_tabi: "a6c4ddb09cdb160478996007bff35296",
    Tenko_shibuki: "64d76089fba26b180d9c9e48a32600d9",
    Aokumo_rin: "516937b5f85cbf2249ce31b0ad046b0f",
    Hanako_nana: "4d812b586ff63f8a2946e64fa860bbf5",
    Yuzuha_riko: "8fd39bb8de623317de90654718638b10"
};

export interface LatestBroadcast {
    title: string;
    date: string;
    url: string;
    isLive: boolean;
}

// chzzk's own video/live-status endpoints reject plain server-to-server
// requests (WAF), but accept the exact same requests when they come from a
// real browser — so a real (headless) browser loads the channel's public
// live page, and we read the JSON responses it naturally makes while
// rendering, rather than hitting the API directly ourselves.
let browserPromise: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
    if (!browserPromise) {
        browserPromise = chromium.launch({
            headless: true,
            // Chromium's sandbox needs a user-namespace setup that most
            // servers (running as root, or inside a container) don't have,
            // so it silently fails to launch there without this — even
            // though it launches fine on a normal desktop dev machine.
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    }
    return browserPromise;
}

interface CapturedResponses {
    liveDetail: any;
    videos: any;
}

// Ceiling for the rare case the page never fires the responses we need at
// all (network hiccup, chzzk markup change, etc). The normal case resolves
// via maybeDone() well before this.
const CAPTURE_TIMEOUT_MS = 20000;

async function captureChannelPage(channelId: string): Promise<CapturedResponses> {
    const browser = await getBrowser();

    const context = await browser.newContext({
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 720 },
        locale: "ko-KR",
        timezoneId: "Asia/Seoul"
    });

    const page = await context.newPage();
    const captured: CapturedResponses = { liveDetail: null, videos: null };

    try {
        // Don't wait for the page's own "done loading" signal — this page
        // keeps loading for a long time after (hundreds of ad/chat-emoji/
        // badge requests), and neither "load" nor "networkidle" reflect
        // when the two responses we actually care about have arrived.
        // Instead resolve as soon as we have what we need: a live broadcast
        // only needs live-detail; a non-live one needs both live-detail
        // (to know it's not live) and videos.
        await new Promise<void>((resolve) => {
            let settled = false;
            const maybeDone = () => {
                if (settled) return;
                const isLive = captured.liveDetail?.content?.status === "OPEN";
                if (isLive || (captured.liveDetail && captured.videos)) {
                    settled = true;
                    resolve();
                }
            };

            page.on("response", async (response) => {
                if (!response.ok()) return;
                const url = response.url();
                try {
                    if (url.includes(`/channels/${channelId}/live-detail`)) {
                        captured.liveDetail = await response.json();
                        maybeDone();
                    } else if (url.includes(`/channels/${channelId}/videos`)) {
                        captured.videos ??= await response.json();
                        maybeDone();
                    }
                } catch {
                    // Non-JSON response (e.g. a redirect/asset) — ignore.
                }
            });

            // Fire-and-forget: navigation keeps running in the background,
            // but completion is driven by maybeDone() above, not by this.
            page.goto(`https://chzzk.naver.com/live/${channelId}`, { timeout: CAPTURE_TIMEOUT_MS }).catch(() => {});

            setTimeout(() => {
                settled = true;
                resolve();
            }, CAPTURE_TIMEOUT_MS);
        });
    } finally {
        // Safe to close mid-navigation — we already have what we need (or
        // hit the timeout), so the rest of the page's load is just wasted
        // work at that point.
        await context.close();
    }

    return captured;
}

// chatChannelId lives inside the same live-detail payload the broadcast
// fetch already captures (content.chatChannelId — present whether the
// channel is live or not), so it's cached alongside the broadcast instead
// of triggering a second Playwright capture for callers that need it (see
// getChatChannelId, used by chzzkProfile.ts for follow/subscribe lookups).
interface CacheEntry {
    broadcast: LatestBroadcast | null;
    chatChannelId: string | null;
    expiresAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
// Dedupes concurrent callers (e.g. getLatestBroadcast + getChatChannelId
// racing for the same stellarId) onto a single in-flight capture instead of
// each kicking off its own Playwright page load.
const inflight = new Map<string, Promise<CacheEntry>>();

async function ensureCached(stellarId: string): Promise<CacheEntry> {
    const cached = cache.get(stellarId);
    if (cached && cached.expiresAt > Date.now()) return cached;

    const existing = inflight.get(stellarId);
    if (existing) return existing;

    const promise = (async (): Promise<CacheEntry> => {
        const channelId = stellarChannelIds[stellarId];
        let entry: CacheEntry;

        if (!channelId) {
            entry = { broadcast: null, chatChannelId: null, expiresAt: Date.now() + CACHE_TTL_MS };
        } else {
            const { liveDetail, videos } = await captureChannelPage(channelId);

            let broadcast: LatestBroadcast | null = null;
            const live = liveDetail?.content;
            if (live?.status === "OPEN") {
                broadcast = {
                    title: live.liveTitle,
                    date: live.openDate,
                    url: `https://chzzk.naver.com/live/${channelId}`,
                    isLive: true
                };
            } else {
                const latestVideo = videos?.content?.data?.[0];
                if (latestVideo) {
                    broadcast = {
                        title: latestVideo.videoTitle,
                        date: latestVideo.publishDate,
                        url: `https://chzzk.naver.com/video/${latestVideo.videoNo}`,
                        isLive: false
                    };
                }
            }

            entry = {
                broadcast,
                chatChannelId: live?.chatChannelId ?? null,
                expiresAt: Date.now() + CACHE_TTL_MS
            };
        }

        cache.set(stellarId, entry);
        inflight.delete(stellarId);
        return entry;
    })();

    inflight.set(stellarId, promise);
    return promise;
}

export async function getLatestBroadcast(stellarId: string): Promise<LatestBroadcast | null> {
    return (await ensureCached(stellarId)).broadcast;
}

// The streamer's chat room id — needed to look up a viewer's follow/
// subscribe status via the (unauthenticated, public) chat profile-card
// endpoint. See chzzkProfile.ts.
export async function getChatChannelId(stellarId: string): Promise<string | null> {
    return (await ensureCached(stellarId)).chatChannelId;
}
