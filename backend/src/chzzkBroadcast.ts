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

    page.on("response", async (response) => {
        if (!response.ok()) return;
        const url = response.url();
        try {
            if (url.includes(`/channels/${channelId}/live-detail`)) {
                captured.liveDetail = await response.json();
            } else if (url.includes(`/channels/${channelId}/videos`)) {
                captured.videos ??= await response.json();
            }
        } catch {
            // Non-JSON response (e.g. a redirect/asset) — ignore.
        }
    });

    try {
        // "networkidle" never reliably fires on this page — it loads a huge
        // long tail of ads/chat-emoji/badge requests that can keep the
        // connection count from settling, especially on a slower network
        // (confirmed: this alone caused the whole capture to silently come
        // back empty on a home server, even though the same code worked
        // fine on a faster dev machine). "load" plus a fixed extra wait for
        // the page's own JS to fire its data requests is far more reliable.
        await page.goto(`https://chzzk.naver.com/live/${channelId}`, {
            waitUntil: "load",
            timeout: 45000
        });
        await page.waitForTimeout(6000);
    } finally {
        await context.close();
    }

    return captured;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { data: LatestBroadcast | null; expiresAt: number }>();

export async function getLatestBroadcast(stellarId: string): Promise<LatestBroadcast | null> {
    const channelId = stellarChannelIds[stellarId];
    if (!channelId) return null;

    const cached = cache.get(stellarId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const { liveDetail, videos } = await captureChannelPage(channelId);

    let result: LatestBroadcast | null = null;
    const live = liveDetail?.content;
    if (live?.status === "OPEN") {
        result = {
            title: live.liveTitle,
            date: live.openDate,
            url: `https://chzzk.naver.com/live/${channelId}`,
            isLive: true
        };
    } else {
        const latestVideo = videos?.content?.data?.[0];
        if (latestVideo) {
            result = {
                title: latestVideo.videoTitle,
                date: latestVideo.publishDate,
                url: `https://chzzk.naver.com/video/${latestVideo.videoNo}`,
                isLive: false
            };
        }
    }

    cache.set(stellarId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
}
