import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { ChzzkUser } from "./chzzkAuth";

export interface Session {
    accessToken: string;
    refreshToken: string;
    user: ChzzkUser;
}

export const SESSION_COOKIE = "sid";

// In-memory only: sessions are lost on restart. Fine while there's a single
// backend instance and no persistence layer yet.
const sessions = new Map<string, Session>();

export function createSession(session: Session): string {
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, session);
    return sessionId;
}

export function deleteSession(sessionId: string): void {
    sessions.delete(sessionId);
}

function getSession(req: Request): Session | undefined {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    return sessionId ? sessions.get(sessionId) : undefined;
}

/** Attaches the caller's session to `res.locals.session`, or responds 401. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const session = getSession(req);
    if (!session) {
        res.status(401).json({ error: "not logged in" });
        return;
    }
    res.locals.session = session;
    next();
}
