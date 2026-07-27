import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { getUserByChannelId, type UserRow } from "./users";

export const AUTH_COOKIE = "token";
const TOKEN_TTL = "30d";
const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface TokenPayload {
    channelId: string;
}

export function signAuthToken(channelId: string): string {
    return jwt.sign({ channelId } satisfies TokenPayload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: TOKEN_MAX_AGE_MS
};

/**
 * Attaches the caller's DB-backed user row to `res.locals.user`, or responds
 * 401. The JWT only carries the channelId — access/refresh tokens and the
 * display name always come from the users table, so revoking/updating a
 * user doesn't require re-issuing outstanding tokens.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) {
        res.status(401).json({ error: "not logged in" });
        return;
    }

    let payload: TokenPayload;
    try {
        payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        res.status(401).json({ error: "not logged in" });
        return;
    }

    const user = getUserByChannelId(payload.channelId);
    if (!user) {
        res.status(401).json({ error: "not logged in" });
        return;
    }

    res.locals.user = user;
    next();
}

export type { UserRow };
