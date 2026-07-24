import "dotenv/config";
import crypto from "node:crypto";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { getStellarYoutubeSummary } from "./youtube";
import { getStreamerInfo } from "./streamerInfo";
import { getLatestBroadcast } from "./chzzkBroadcast";
import { getFollowSubscribeInfo } from "./chzzkProfile";

const CHZZK_CLIENT_ID = process.env.chzzk_client_id;
const CHZZK_CLIENT_SECRET = process.env.chzzk_client_secret;
const CHZZK_REDIRECT_URI = process.env.chzzk_redirect_uri;
const FRONTEND_URL = process.env.frontend_url ?? "http://localhost:5173";
const PORT = process.env.port ?? 3000;

if (!CHZZK_CLIENT_ID || !CHZZK_CLIENT_SECRET || !CHZZK_REDIRECT_URI) {
    console.error("❌ [.env 오류] 치지직 API 관련 환경변수가 설정되지 않았습니다.");
    console.error(`- CHZZK_CLIENT_ID: ${CHZZK_CLIENT_ID}`);
    console.error(`- CHZZK_CLIENT_SECRET: ${CHZZK_CLIENT_SECRET}`);
    console.error(`- CHZZK_REDIRECT_URI: ${CHZZK_REDIRECT_URI}`);
    process.exit(1);
}

const CHZZK_AUTHORIZE_URL = "https://chzzk.naver.com/account-interlock";
const CHZZK_TOKEN_URL = "https://openapi.chzzk.naver.com/auth/v1/token";
const CHZZK_USER_URL = "https://openapi.chzzk.naver.com/open/v1/users/me";

interface ChzzkTokenResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

interface ChzzkEnvelope<T> {
    code: number;
    message: string | null;
    content: T;
}

interface ChzzkUser {
    channelId: string;
    channelName: string;
}

interface Session {
    accessToken: string;
    refreshToken: string;
    user: ChzzkUser;
}

// In-memory only: sessions and refresh tokens are lost on restart. Fine while
// there's a single backend instance and no persistence layer yet.
const sessions = new Map<string, Session>();

// CSRF guard for the OAuth redirect: a state minted by /login must come back
// unchanged on /callback, and can only be used once.
const pendingStates = new Set<string>();
const STATE_TTL_MS = 5 * 60 * 1000;

const SESSION_COOKIE = "sid";

const app = express();
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.get("/login", (_req, res) => {
    const state = crypto.randomUUID();
    pendingStates.add(state);
    setTimeout(() => pendingStates.delete(state), STATE_TTL_MS);

    const authorizeUrl = new URL(CHZZK_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("clientId", CHZZK_CLIENT_ID);
    authorizeUrl.searchParams.set("redirectUri", CHZZK_REDIRECT_URI);
    authorizeUrl.searchParams.set("state", state);

    res.redirect(authorizeUrl.toString());
});

app.get("/callback", async (req, res) => {
    const { code, state } = req.query;

    if (typeof code !== "string" || typeof state !== "string" || !pendingStates.has(state)) {
        res.redirect(`${FRONTEND_URL}/?login=failed`);
        return;
    }
    pendingStates.delete(state);

    try {
        const tokenRes = await fetch(CHZZK_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                grantType: "authorization_code",
                clientId: CHZZK_CLIENT_ID,
                clientSecret: CHZZK_CLIENT_SECRET,
                code,
                state
            })
        });
        if (!tokenRes.ok) {
            throw new Error(`token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
        }
        const tokenBody: ChzzkEnvelope<ChzzkTokenResponse> | ChzzkTokenResponse =
            await tokenRes.json();
        // Docs show this response unwrapped, but in practice it comes back
        // wrapped in the same {code, message, content} envelope as other
        // endpoints, so accept either shape.
        const token: ChzzkTokenResponse = "content" in tokenBody ? tokenBody.content : tokenBody;

        const userRes = await fetch(CHZZK_USER_URL, {
            headers: { Authorization: `Bearer ${token.accessToken}` }
        });
        if (!userRes.ok) {
            throw new Error(`user info fetch failed: ${userRes.status} ${await userRes.text()}`);
        }
        const userEnvelope: ChzzkEnvelope<ChzzkUser> = await userRes.json();

        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            user: userEnvelope.content
        });

        res.cookie(SESSION_COOKIE, sessionId, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        res.redirect(FRONTEND_URL);
    } catch (err) {
        console.error("chzzk oauth callback failed:", err);
        res.redirect(`${FRONTEND_URL}/?login=failed`);
    }
});

app.get("/me", (req, res) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    const session = sessionId ? sessions.get(sessionId) : undefined;

    if (!session) {
        res.status(401).json({ error: "not logged in" });
        return;
    }
    res.json(session.user);
});

// TEMP: probes whether the unofficial "my-info" endpoint accepts our
// official OAuth access token as a Bearer token instead of requiring a
// NID_AUT/NID_SES browser session. Remove once we know the answer.
app.get("/debug/my-info", async (req, res) => {
    console.log("debug/my-info called");
    const sessionId = req.cookies?.[SESSION_COOKIE];
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (!session) {
        res.status(401).json({ error: "not logged in" });
        return;
    }

    const channelId = req.query.channelId;
    if (typeof channelId !== "string") {
        res.status(400).json({ error: "channelId query param required" });
        return;
    }

    const url = `https://api.chzzk.naver.com/service/v1.1/channels/${channelId}/my-info`;
    const upstream = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
    });
    const text = await upstream.text();
    res.status(upstream.status).type("application/json").send(text);
});

app.get("/streamer-info/:stellarId", async (req, res) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (!session) {
        res.status(401).json({ error: "not logged in" });
        return;
    }

    const info = getStreamerInfo(req.params.stellarId);
    if (!info) {
        res.status(404).json({ error: "no data for this stellar" });
        return;
    }

    const [broadcast, followSubscribe] = await Promise.all([
        getLatestBroadcast(req.params.stellarId).catch((err) => {
            console.error("broadcast fetch failed:", err);
            return null;
        }),
        getFollowSubscribeInfo(req.params.stellarId, session.user.channelId).catch((err) => {
            console.error("follow/subscribe fetch failed:", err);
            return null;
        })
    ]);

    res.json({
        ...info,
        last_stream_date: broadcast?.date ?? "",
        last_stream_title: broadcast?.title ?? "",
        last_stream_url: broadcast?.url ?? "",
        is_live: broadcast?.isLive ?? false,
        follow_date: followSubscribe?.followDate ?? null,
        subscribe_month: followSubscribe?.subscribeMonths ?? 0
    });
});

app.get("/youtube/:stellarId", async (req, res) => {
    try {
        const summary = await getStellarYoutubeSummary(req.params.stellarId);
        if (!summary) {
            res.status(404).json({ error: "no youtube data for this stellar" });
            return;
        }
        res.json(summary);
    } catch (err) {
        console.error("youtube summary fetch failed:", err);
        res.status(502).json({ error: "failed to fetch youtube data" });
    }
});

app.post("/logout", (req, res) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (sessionId) sessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

setInterval(() => {}, 1000 * 60 * 60);

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server closed gracefully');
        process.exit(0);
    });
});