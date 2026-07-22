"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stellarYoutubeConfig = void 0;
exports.getStellarYoutubeSummary = getStellarYoutubeSummary;
// Checked lazily (not at module load) so a missing key only breaks the
// youtube endpoints, not the whole server — login etc. still work fine
// without it configured yet.
const YOUTUBE_API_KEY = process.env.youtube_api_key;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
// Curated by hand from each stellar's official YouTube channel. `handle`
// resolves (via channels.list) to the channel's auto-generated "uploads"
// playlist, which gives the latest video without a dedicated
// channel-videos endpoint. `musicPlaylists` are the channel-curated
// cover/original-song playlists to scan for the latest music upload.
exports.stellarYoutubeConfig = {
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
function youtubeApiGet(path, params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!YOUTUBE_API_KEY) {
            throw new Error("Missing youtube_api_key in backend/.env");
        }
        const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
        for (const [key, value] of Object.entries(params))
            url.searchParams.set(key, value);
        url.searchParams.set("key", YOUTUBE_API_KEY);
        const res = yield fetch(url);
        if (!res.ok) {
            throw new Error(`${path} failed: ${res.status} ${yield res.text()}`);
        }
        return res.json();
    });
}
// Handle -> uploads playlist id barely ever changes, so this is cached far
// longer than the video summaries below.
const UPLOADS_PLAYLIST_TTL_MS = 24 * 60 * 60 * 1000;
const uploadsPlaylistCache = new Map();
function resolveUploadsPlaylistId(handle) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const cached = uploadsPlaylistCache.get(handle);
        if (cached && cached.expiresAt > Date.now())
            return cached.playlistId;
        const body = yield youtubeApiGet("channels", { part: "contentDetails", forHandle: handle });
        const playlistId = (_d = (_c = (_b = (_a = body.items) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.contentDetails) === null || _c === void 0 ? void 0 : _c.relatedPlaylists) === null || _d === void 0 ? void 0 : _d.uploads;
        if (!playlistId)
            throw new Error(`no uploads playlist found for handle ${handle}`);
        uploadsPlaylistCache.set(handle, { playlistId, expiresAt: Date.now() + UPLOADS_PLAYLIST_TTL_MS });
        return playlistId;
    });
}
function fetchPlaylistItems(playlistId, maxResults) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        let body;
        try {
            body = yield youtubeApiGet("playlistItems", {
                part: "snippet",
                playlistId,
                maxResults: String(maxResults)
            });
        }
        catch (err) {
            // A playlist that's been deleted/unlisted shouldn't take down the
            // whole summary for a stellar with other, still-valid playlists.
            console.error(`playlistItems fetch failed for ${playlistId}:`, err);
            return [];
        }
        const items = (_a = body.items) !== null && _a !== void 0 ? _a : [];
        return items
            .filter((item) => { var _a, _b, _c; return ((_b = (_a = item.snippet) === null || _a === void 0 ? void 0 : _a.resourceId) === null || _b === void 0 ? void 0 : _b.videoId) && ((_c = item.snippet) === null || _c === void 0 ? void 0 : _c.publishedAt); })
            .map((item) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const snippet = item.snippet;
            const videoId = snippet.resourceId.videoId;
            const thumbnails = (_a = snippet.thumbnails) !== null && _a !== void 0 ? _a : {};
            const thumbnail = (_g = (_e = (_c = (_b = thumbnails.high) === null || _b === void 0 ? void 0 : _b.url) !== null && _c !== void 0 ? _c : (_d = thumbnails.medium) === null || _d === void 0 ? void 0 : _d.url) !== null && _e !== void 0 ? _e : (_f = thumbnails.default) === null || _f === void 0 ? void 0 : _f.url) !== null && _g !== void 0 ? _g : null;
            return {
                id: videoId,
                title: (_h = snippet.title) !== null && _h !== void 0 ? _h : "",
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail,
                publishedAt: snippet.publishedAt
            };
        });
    });
}
function mostRecent(videos) {
    if (videos.length === 0)
        return null;
    return videos.reduce((latest, candidate) => new Date(candidate.publishedAt) > new Date(latest.publishedAt) ? candidate : latest);
}
function fetchLatestUpload(handle) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadsPlaylistId = yield resolveUploadsPlaylistId(handle);
        // The uploads playlist is effectively always newest-first, but a small
        // page plus an explicit max-by-date pick costs nothing and doesn't rely
        // on that assumption holding forever.
        return mostRecent(yield fetchPlaylistItems(uploadsPlaylistId, 5));
    });
}
function fetchLatestMusicVideo(playlistIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const lists = yield Promise.all(playlistIds.map((id) => fetchPlaylistItems(id, 10)));
        return mostRecent(lists.flat());
    });
}
const SUMMARY_TTL_MS = 30 * 60 * 1000;
const summaryCache = new Map();
function getStellarYoutubeSummary(stellarId) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = exports.stellarYoutubeConfig[stellarId];
        if (!config)
            return null;
        const cached = summaryCache.get(stellarId);
        if (cached && cached.expiresAt > Date.now())
            return cached.data;
        const [latestVideo, latestMusicVideo] = yield Promise.all([
            fetchLatestUpload(config.handle),
            fetchLatestMusicVideo(config.musicPlaylists)
        ]);
        const data = { latestVideo, latestMusicVideo };
        summaryCache.set(stellarId, { data, expiresAt: Date.now() + SUMMARY_TTL_MS });
        return data;
    });
}
