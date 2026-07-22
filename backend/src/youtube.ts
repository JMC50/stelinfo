// Checked lazily (not at module load) so a missing key only breaks the
// youtube endpoints, not the whole server — login etc. still work fine
// without it configured yet.
const YOUTUBE_API_KEY = process.env.youtube_api_key;

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface StellarYoutubeConfig {
    handle: string;
    musicPlaylists: string[];
}

// Curated by hand from each stellar's official YouTube channel. `handle`
// resolves (via channels.list) to the channel's auto-generated "uploads"
// playlist, which gives the latest video without a dedicated
// channel-videos endpoint. `musicPlaylists` are the channel-curated
// cover/original-song playlists to scan for the latest music upload.
export const stellarYoutubeConfig: Record<string, StellarYoutubeConfig> = {
    Gangzi: {
        handle: "@GANGZI1",
        musicPlaylists: ["PLcNhHeUzY-uhGYqnZr8YLkEfxnPOW_QNz"]
    },
    Ayatsuno_yuni: {
        handle: "@ayatsunoyuni",
        musicPlaylists: ["PL3HtH_xx9h_4ulddfVG8DdD_EwKUMBqvL", "PL3HtH_xx9h_7ZGoZ9zMUQ-MPumwe21_cc"]
    },
    Shirayuki_hina: {
        handle: "@shirayukihina",
        musicPlaylists: [
            "PLzdLDJsHzz2N49b_83u_ug3Lwq7HHWx2W",
            "PLzdLDJsHzz2OzXsHwt35PHjDq7r93xM1L",
            "PLzdLDJsHzz2NiuwjyW6QgSck4PrwlSyOc"
        ]
    },
    Akane_lize: {
        handle: "@akanelize",
        musicPlaylists: ["PL-DHk0WpiRNSM5oI19ImJ8sSV65mnGseX", "PL-DHk0WpiRNSHxQzKx88q2kmJVwlCQCNq"]
    },
    Neneko_mashiro: {
        handle: "@neneko_mashiro",
        musicPlaylists: ["PLWwhuXFHGLvgHQY8lryIUP7vf9i8-TJrk", "PLWwhuXFHGLvhgZZb5_rmQEMI1B0ysKJxG"]
    },
    Arahashi_tabi: {
        handle: "@arahashitabi",
        musicPlaylists: ["PLbIDsfX2JRA0TXoG69AT8Iu9QEB9lUC2s", "PLbIDsfX2JRA0oawGN209gpd_nz9IMvUlb"]
    },
    Tenko_shibuki: {
        handle: "@tenkoshibuki",
        musicPlaylists: ["PLKVNBOcsLJlVii-8YwoZTD3o4gh5CnIND"]
    },
    Aokumo_rin: {
        handle: "@aokumorin",
        musicPlaylists: ["PLSDRWR15h-o7xvAej539Ggs2Kjb22y3_M", "PLSDRWR15h-o4uWNeoLv0upOUUGj12f-yU"]
    },
    Hanako_nana: {
        handle: "@hanako_nana",
        musicPlaylists: [
            "PLJWmDIpvwe7Cri29xtAyQXLC1RLwOChpA",
            "PLJWmDIpvwe7CQTYQdGqEipTd7IMX10VHm",
            "PLJWmDIpvwe7AjKVPmgswsIVg1ETJyzGvB"
        ]
    },
    Yuzuha_riko: {
        handle: "@yuzuhariko",
        musicPlaylists: ["PL_D2YrKeYY2U6GvgRx8Ai-VaddWQarbnL", "PL_D2YrKeYY2UvRIw_SW3lQXzBDO7aBeii"]
    },
    Sakihane_huya: {
        handle: "@Sakihanechannel",
        musicPlaylists: ["PL3rF5rqFNO48ZMgPuZ6XbQ1J9IT3TQtcs"]
    }
};

export interface YoutubeVideoSummary {
    id: string;
    title: string;
    url: string;
    thumbnail: string | null;
    publishedAt: string;
}

export interface StellarYoutubeSummary {
    latestVideo: YoutubeVideoSummary | null;
    latestMusicVideo: YoutubeVideoSummary | null;
}

interface YoutubeApiThumbnail {
    url: string;
}

interface YoutubePlaylistItem {
    snippet?: {
        title?: string;
        publishedAt?: string;
        resourceId?: { videoId?: string };
        thumbnails?: Record<string, YoutubeApiThumbnail>;
    };
}

async function youtubeApiGet(path: string, params: Record<string, string>): Promise<any> {
    if (!YOUTUBE_API_KEY) {
        throw new Error("Missing youtube_api_key in backend/.env");
    }

    const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    url.searchParams.set("key", YOUTUBE_API_KEY);

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
    }
    return res.json();
}

// Handle -> uploads playlist id barely ever changes, so this is cached far
// longer than the video summaries below.
const UPLOADS_PLAYLIST_TTL_MS = 24 * 60 * 60 * 1000;
const uploadsPlaylistCache = new Map<string, { playlistId: string; expiresAt: number }>();

async function resolveUploadsPlaylistId(handle: string): Promise<string> {
    const cached = uploadsPlaylistCache.get(handle);
    if (cached && cached.expiresAt > Date.now()) return cached.playlistId;

    const body = await youtubeApiGet("channels", { part: "contentDetails", forHandle: handle });
    const playlistId = body.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!playlistId) throw new Error(`no uploads playlist found for handle ${handle}`);

    uploadsPlaylistCache.set(handle, { playlistId, expiresAt: Date.now() + UPLOADS_PLAYLIST_TTL_MS });
    return playlistId;
}

async function fetchPlaylistItems(playlistId: string, maxResults: number): Promise<YoutubeVideoSummary[]> {
    let body: any;
    try {
        body = await youtubeApiGet("playlistItems", {
            part: "snippet",
            playlistId,
            maxResults: String(maxResults)
        });
    } catch (err) {
        // A playlist that's been deleted/unlisted shouldn't take down the
        // whole summary for a stellar with other, still-valid playlists.
        console.error(`playlistItems fetch failed for ${playlistId}:`, err);
        return [];
    }

    const items: YoutubePlaylistItem[] = body.items ?? [];
    return items
        .filter((item) => item.snippet?.resourceId?.videoId && item.snippet?.publishedAt)
        .map((item) => {
            const snippet = item.snippet!;
            const videoId = snippet.resourceId!.videoId!;
            const thumbnails = snippet.thumbnails ?? {};
            const thumbnail = thumbnails.high?.url ?? thumbnails.medium?.url ?? thumbnails.default?.url ?? null;
            return {
                id: videoId,
                title: snippet.title ?? "",
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail,
                publishedAt: snippet.publishedAt!
            };
        });
}

function mostRecent(videos: YoutubeVideoSummary[]): YoutubeVideoSummary | null {
    if (videos.length === 0) return null;
    return videos.reduce((latest, candidate) =>
        new Date(candidate.publishedAt) > new Date(latest.publishedAt) ? candidate : latest
    );
}

async function fetchLatestUpload(handle: string): Promise<YoutubeVideoSummary | null> {
    const uploadsPlaylistId = await resolveUploadsPlaylistId(handle);
    // The uploads playlist is effectively always newest-first, but a small
    // page plus an explicit max-by-date pick costs nothing and doesn't rely
    // on that assumption holding forever.
    return mostRecent(await fetchPlaylistItems(uploadsPlaylistId, 5));
}

async function fetchLatestMusicVideo(playlistIds: string[]): Promise<YoutubeVideoSummary | null> {
    const lists = await Promise.all(playlistIds.map((id) => fetchPlaylistItems(id, 10)));
    return mostRecent(lists.flat());
}

const SUMMARY_TTL_MS = 30 * 60 * 1000;
const summaryCache = new Map<string, { data: StellarYoutubeSummary; expiresAt: number }>();

export async function getStellarYoutubeSummary(
    stellarId: string
): Promise<StellarYoutubeSummary | null> {
    const config = stellarYoutubeConfig[stellarId];
    if (!config) return null;

    const cached = summaryCache.get(stellarId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const [latestVideo, latestMusicVideo] = await Promise.all([
        fetchLatestUpload(config.handle),
        fetchLatestMusicVideo(config.musicPlaylists)
    ]);

    const data: StellarYoutubeSummary = { latestVideo, latestMusicVideo };
    summaryCache.set(stellarId, { data, expiresAt: Date.now() + SUMMARY_TTL_MS });
    return data;
}
