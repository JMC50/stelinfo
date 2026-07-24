import crypto from "node:crypto";
import { CHZZK_CLIENT_ID, CHZZK_CLIENT_SECRET, CHZZK_REDIRECT_URI } from "./config";

const CHZZK_AUTHORIZE_URL = "https://chzzk.naver.com/account-interlock";
const CHZZK_TOKEN_URL = "https://openapi.chzzk.naver.com/auth/v1/token";
const CHZZK_USER_URL = "https://openapi.chzzk.naver.com/open/v1/users/me";

export interface ChzzkTokenResponse {
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

export interface ChzzkUser {
    channelId: string;
    channelName: string;
}

// CSRF guard for the OAuth redirect: a state minted by buildAuthorizeUrl must
// come back unchanged on /callback, and can only be used once.
const pendingStates = new Set<string>();
const STATE_TTL_MS = 5 * 60 * 1000;

export function buildAuthorizeUrl(): string {
    const state = crypto.randomUUID();
    pendingStates.add(state);
    setTimeout(() => pendingStates.delete(state), STATE_TTL_MS);

    const url = new URL(CHZZK_AUTHORIZE_URL);
    url.searchParams.set("clientId", CHZZK_CLIENT_ID);
    url.searchParams.set("redirectUri", CHZZK_REDIRECT_URI);
    url.searchParams.set("state", state);
    return url.toString();
}

export function consumeState(state: string): boolean {
    if (!pendingStates.has(state)) return false;
    pendingStates.delete(state);
    return true;
}

export async function exchangeCodeForToken(code: string, state: string): Promise<ChzzkTokenResponse> {
    const res = await fetch(CHZZK_TOKEN_URL, {
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
    if (!res.ok) {
        throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
    }
    const body: ChzzkEnvelope<ChzzkTokenResponse> | ChzzkTokenResponse = await res.json();
    // Docs show this response unwrapped, but in practice it comes back
    // wrapped in the same {code, message, content} envelope as other
    // endpoints, so accept either shape.
    return "content" in body ? body.content : body;
}

export async function fetchChzzkUser(accessToken: string): Promise<ChzzkUser> {
    const res = await fetch(CHZZK_USER_URL, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
        throw new Error(`user info fetch failed: ${res.status} ${await res.text()}`);
    }
    const envelope: ChzzkEnvelope<ChzzkUser> = await res.json();
    return envelope.content;
}
