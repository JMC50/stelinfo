import express from "express";
import { buildAuthorizeUrl, consumeState, exchangeCodeForToken, fetchChzzkUser } from "../chzzkAuth";
import { FRONTEND_URL } from "../config";
import { createSession, deleteSession, requireAuth, SESSION_COOKIE, type Session } from "../session";

export const authRouter = express.Router();

authRouter.get("/login", (_req, res) => {
    res.redirect(buildAuthorizeUrl());
});

authRouter.get("/callback", async (req, res) => {
    const { code, state } = req.query;

    if (typeof code !== "string" || typeof state !== "string" || !consumeState(state)) {
        res.redirect(`${FRONTEND_URL}/?login=failed`);
        return;
    }

    try {
        const token = await exchangeCodeForToken(code, state);
        const user = await fetchChzzkUser(token.accessToken);

        const sessionId = createSession({
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            user
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

authRouter.get("/me", requireAuth, (_req, res) => {
    const session = res.locals.session as Session;
    res.json(session.user);
});

authRouter.post("/logout", (req, res) => {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (sessionId) deleteSession(sessionId);
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
});
