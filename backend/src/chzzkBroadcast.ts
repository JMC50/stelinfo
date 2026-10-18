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
    Yuzuha_riko: "N2db7a",
    Shizuki_Toa: "N2oK4A",
    Cogane_Rang: "N2oKTR",
    Hanayo_Hiyori: "N2oRiA",
    Tokino_Mary: "N2oS8N"
};

export function getChatChannelId(stellarId: string): string | null {
    return CHAT_CHANNEL_IDS[stellarId] ?? null;
}

// Members who haven't broadcast yet — chzzk only assigns a chatChannelId
// on first stream, so there's nothing to put in CHAT_CHANNEL_IDS for them.
// chzzkProfile.ts falls back to a different (undocumented) endpoint variant
// for these: `/profile?streamingChannelId=...` resolves the channel from
// this raw chzzk channelId instead of a chat channel id, and tolerates a
// placeholder in the path where the chat channel id would normally go.
// That behavior isn't documented or guaranteed, so this is a stopgap —
// once a member's real chatChannelId shows up after their first stream,
// move their entry to CHAT_CHANNEL_IDS above and delete it from here.
const PENDING_DEBUT_CHANNEL_IDS: Record<string, string> = {
    // Empty until the next member debuts — Shizuki_Toa/Cogane_Rang/
    // Hanayo_Hiyori/Tokino_Mary all moved up to CHAT_CHANNEL_IDS once their
    // first broadcast assigned them a real chatChannelId.
};

export function getPendingDebutChannelId(stellarId: string): string | null {
    return PENDING_DEBUT_CHANNEL_IDS[stellarId] ?? null;
}
