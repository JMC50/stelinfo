import express from "express";
import { AUTH_COOKIE, AUTH_COOKIE_OPTIONS, requireAuth, signAuthToken, type UserRow } from "../auth";
import { buildAuthorizeUrl, consumeState, exchangeCodeForToken, fetchChzzkUser } from "../chzzkAuth";
import { FRONTEND_URL } from "../config";
import { upsertUser } from "../users";

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

        upsertUser({
            channelId: user.channelId,
            channelName: user.channelName,
            accessToken: token.accessToken,
            refreshToken: token.refreshToken
        });

        res.cookie(AUTH_COOKIE, signAuthToken(user.channelId), AUTH_COOKIE_OPTIONS);
        res.redirect(FRONTEND_URL);
    } catch (err) {
        console.error("chzzk oauth callback failed:", err);
        res.redirect(`${FRONTEND_URL}/?login=failed`);
    }
});

authRouter.get("/me", requireAuth, (_req, res) => {
    const user = res.locals.user as UserRow;
    res.json({ channelId: user.channel_id, channelName: user.channel_name, xId: user.x_id });
});

authRouter.post("/logout", (_req, res) => {
    res.clearCookie(AUTH_COOKIE);
    res.status(204).end();
});
