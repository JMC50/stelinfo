// Broadcast/replay status used to come from a Playwright capture running in
// this process (WAF blocks plain server-to-server requests to chzzk's
// live-detail/videos endpoints, so a headless browser loaded the channel
// page and read the JSON responses it made while rendering). That's now
// handled by the stellar_status service, which polls every streamer on its
// own schedule and keeps the latest result in memory — this file just reads
// it over HTTP.
const SUBSERVER_PORT = process.env.subserver_port;

const REQUEST_TIMEOUT_MS = 5000;

export interface LatestBroadcast {
    title: string;
    date: string;
    url: string;
    isLive: boolean;
}

function getSubserverBaseUrl(): string {
    if (!SUBSERVER_PORT) {
        throw new Error("Missing subserver_port in backend/.env");
    }
    return `http://localhost:${SUBSERVER_PORT}`;
}

export async function getLatestBroadcast(stellarId: string): Promise<LatestBroadcast | null> {
    const res = await fetch(`${getSubserverBaseUrl()}/status/${encodeURIComponent(stellarId)}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`stellar_status /status/${stellarId} failed: ${res.status} ${await res.text()}`);
    }
    return (await res.json()) as LatestBroadcast;
}

// The streamer's chat room id — needed to look up a viewer's follow/
// subscribe status via the (unauthenticated, public) chat profile-card
// endpoint (see chzzkProfile.ts). Effectively static per streamer, so it's
// hand-maintained here instead of being fetched/polled.
const CHAT_CHANNEL_IDS: Record<string, string> = {
    Gangzi: "N2daLJ",
    Ayatsuno_yuni: "N2d5MO",
    Sakihane_huya: "N2dT4n",
    Shirayuki_hina: "N2dScA",
    Neneko_mashiro: "N2db3J",
    Akane_lize: "N2dUaS",
    Arahashi_tabi: "N2de2B",
    Tenko_shibuki: "N2dc9q",
    Aokumo_rin: "N2dc1n",
    Hanako_nana: "N2dL07",
    Yuzuha_riko: "N2db7a"
};

export function getChatChannelId(stellarId: string): string | null {
    return CHAT_CHANNEL_IDS[stellarId] ?? null;
}
