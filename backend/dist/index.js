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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_crypto_1 = __importDefault(require("node:crypto"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const youtube_1 = require("./youtube");
const streamerInfo_1 = require("./streamerInfo");
const chzzkBroadcast_1 = require("./chzzkBroadcast");
const CHZZK_CLIENT_ID = process.env.chzzk_client_id;
const CHZZK_CLIENT_SECRET = process.env.chzzk_client_secret;
const CHZZK_REDIRECT_URI = process.env.chzzk_redirect_uri;
const FRONTEND_URL = (_a = process.env.frontend_url) !== null && _a !== void 0 ? _a : "http://localhost:5173";
const PORT = (_b = process.env.port) !== null && _b !== void 0 ? _b : 3000;
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
// In-memory only: sessions and refresh tokens are lost on restart. Fine while
// there's a single backend instance and no persistence layer yet.
const sessions = new Map();
// CSRF guard for the OAuth redirect: a state minted by /login must come back
// unchanged on /callback, and can only be used once.
const pendingStates = new Set();
const STATE_TTL_MS = 5 * 60 * 1000;
const SESSION_COOKIE = "sid";
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ origin: FRONTEND_URL, credentials: true }));
app.get("/", (req, res) => {
    res.send("Hello, World!");
});
app.get("/login", (_req, res) => {
    const state = node_crypto_1.default.randomUUID();
    pendingStates.add(state);
    setTimeout(() => pendingStates.delete(state), STATE_TTL_MS);
    const authorizeUrl = new URL(CHZZK_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("clientId", CHZZK_CLIENT_ID);
    authorizeUrl.searchParams.set("redirectUri", CHZZK_REDIRECT_URI);
    authorizeUrl.searchParams.set("state", state);
    res.redirect(authorizeUrl.toString());
});
app.get("/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, state } = req.query;
    if (typeof code !== "string" || typeof state !== "string" || !pendingStates.has(state)) {
        res.redirect(`${FRONTEND_URL}/?login=failed`);
        return;
    }
    pendingStates.delete(state);
    try {
        const tokenRes = yield fetch(CHZZK_TOKEN_URL, {
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
            throw new Error(`token exchange failed: ${tokenRes.status} ${yield tokenRes.text()}`);
        }
        const tokenBody = yield tokenRes.json();
        // Docs show this response unwrapped, but in practice it comes back
        // wrapped in the same {code, message, content} envelope as other
        // endpoints, so accept either shape.
        const token = "content" in tokenBody ? tokenBody.content : tokenBody;
        const userRes = yield fetch(CHZZK_USER_URL, {
            headers: { Authorization: `Bearer ${token.accessToken}` }
        });
        if (!userRes.ok) {
            throw new Error(`user info fetch failed: ${userRes.status} ${yield userRes.text()}`);
        }
        const userEnvelope = yield userRes.json();
        const sessionId = node_crypto_1.default.randomUUID();
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
    }
    catch (err) {
        console.error("chzzk oauth callback failed:", err);
        res.redirect(`${FRONTEND_URL}/?login=failed`);
    }
}));
app.get("/me", (req, res) => {
    var _a;
    const sessionId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[SESSION_COOKIE];
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
app.get("/debug/my-info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("debug/my-info called");
    const sessionId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[SESSION_COOKIE];
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
    const upstream = yield fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
    });
    const text = yield upstream.text();
    res.status(upstream.status).type("application/json").send(text);
}));
app.get("/streamer-info/:stellarId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const sessionId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[SESSION_COOKIE];
    const session = sessionId ? sessions.get(sessionId) : undefined;
    if (!session) {
        res.status(401).json({ error: "not logged in" });
        return;
    }
    const info = (0, streamerInfo_1.getStreamerInfo)(req.params.stellarId);
    if (!info) {
        res.status(404).json({ error: "no data for this stellar" });
        return;
    }
    const broadcast = yield (0, chzzkBroadcast_1.getLatestBroadcast)(req.params.stellarId).catch((err) => {
        console.error("broadcast fetch failed:", err);
        return null;
    });
    res.json(Object.assign(Object.assign({}, info), { last_stream_date: (_b = broadcast === null || broadcast === void 0 ? void 0 : broadcast.date) !== null && _b !== void 0 ? _b : "", last_stream_title: (_c = broadcast === null || broadcast === void 0 ? void 0 : broadcast.title) !== null && _c !== void 0 ? _c : "", last_stream_url: (_d = broadcast === null || broadcast === void 0 ? void 0 : broadcast.url) !== null && _d !== void 0 ? _d : "", is_live: (_e = broadcast === null || broadcast === void 0 ? void 0 : broadcast.isLive) !== null && _e !== void 0 ? _e : false }));
}));
app.get("/youtube/:stellarId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const summary = yield (0, youtube_1.getStellarYoutubeSummary)(req.params.stellarId);
        if (!summary) {
            res.status(404).json({ error: "no youtube data for this stellar" });
            return;
        }
        res.json(summary);
    }
    catch (err) {
        console.error("youtube summary fetch failed:", err);
        res.status(502).json({ error: "failed to fetch youtube data" });
    }
}));
app.post("/logout", (req, res) => {
    var _a;
    const sessionId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[SESSION_COOKIE];
    if (sessionId)
        sessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
});
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
setInterval(() => { }, 1000 * 60 * 60);
process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server closed gracefully');
        process.exit(0);
    });
});
