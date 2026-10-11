import crypto from "node:crypto";
import { getFollowSubscribeInfo, type SubscriptionBadge, type ViewerBadge } from "./chzzkProfile";
import db from "./db";

export interface ShareRow {
    id: string;
    channel_id: string;
    stellar_id: string;
    claimed_handle: string;
    follow_date: string | null;
    subscribe_month: number;
    // Stored as JSON text (SQLite has no array/object column type) — null
    // means "never fetched", "[]"/"null" mean "fetched, had none".
    subscription_badge_json: string | null;
    badges_json: string | null;
    created_at: string;
    updated_at: string;
    revoked_at: string | null;
}

export function parseSubscriptionBadge(json: string | null): SubscriptionBadge | null {
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export function parseBadges(json: string | null): ViewerBadge[] {
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch {
        return [];
    }
}

// Giveaway hosts type these in by hand off a screenshot, so the alphabet is
// uppercase-only and drops visually ambiguous characters (0/O, 1/I/L) —
// no mixed case, no symbols. 256 % 32 === 0, so `byte % 32` is unbiased.
const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ID_LENGTH = 8;

function generateShareId(): string {
    const bytes = crypto.randomBytes(ID_LENGTH);
    let id = "";
    for (const b of bytes) id += ID_ALPHABET[b % ID_ALPHABET.length];
    return id;
}

/** Case-insensitive lookups: hosts retyping a code shouldn't need to match case. */
export function normalizeShareId(id: string): string {
    return id.trim().toUpperCase();
}

const findExistingStmt = db.prepare(
    `SELECT id FROM shares WHERE channel_id = ? AND stellar_id = ?`
);

const insertStmt = db.prepare(`
    INSERT INTO shares (id, channel_id, stellar_id, claimed_handle, follow_date, subscribe_month, subscription_badge_json, badges_json)
    VALUES (@id, @channelId, @stellarId, @claimedHandle, @followDate, @subscribeMonth, @subscriptionBadgeJson, @badgesJson)
`);

const updateStmt = db.prepare(`
    UPDATE shares
    SET claimed_handle = @claimedHandle,
        follow_date = @followDate,
        subscribe_month = @subscribeMonth,
        subscription_badge_json = @subscriptionBadgeJson,
        badges_json = @badgesJson,
        revoked_at = NULL,
        updated_at = datetime('now')
    WHERE id = @id
`);

// One share slot per (user, stellar): re-sharing refreshes the same id/link
// with the latest snapshot instead of minting a new one every time.
export function upsertShare(params: {
    channelId: string;
    stellarId: string;
    claimedHandle: string;
    followDate: string | null;
    subscribeMonth: number;
    subscriptionBadge: SubscriptionBadge | null;
    badges: ViewerBadge[];
}): string {
    const existing = findExistingStmt.get(params.channelId, params.stellarId) as
        | { id: string }
        | undefined;
    const row = {
        channelId: params.channelId,
        stellarId: params.stellarId,
        claimedHandle: params.claimedHandle,
        followDate: params.followDate,
        subscribeMonth: params.subscribeMonth,
        subscriptionBadgeJson: JSON.stringify(params.subscriptionBadge),
        badgesJson: JSON.stringify(params.badges)
    };

    if (existing) {
        updateStmt.run({ ...row, id: existing.id });
        return existing.id;
    }

    const id = generateShareId();
    insertStmt.run({ ...row, id });
    return id;
}

const getByIdStmt = db.prepare(`SELECT * FROM shares WHERE id = ?`);

export function getShareById(id: string): ShareRow | undefined {
    return getByIdStmt.get(normalizeShareId(id)) as ShareRow | undefined;
}

const listByChannelStmt = db.prepare(
    `SELECT * FROM shares WHERE channel_id = ? ORDER BY updated_at DESC`
);

export function listSharesByChannel(channelId: string): ShareRow[] {
    return listByChannelStmt.all(channelId) as ShareRow[];
}

const revokeStmt = db.prepare(
    `UPDATE shares SET revoked_at = datetime('now') WHERE id = ? AND channel_id = ?`
);

/** Returns false if the share doesn't exist or isn't owned by this channel. */
export function revokeShare(id: string, channelId: string): boolean {
    return revokeStmt.run(normalizeShareId(id), channelId).changes > 0;
}

const refreshStmt = db.prepare(`
    UPDATE shares
    SET follow_date = @followDate,
        subscribe_month = @subscribeMonth,
        subscription_badge_json = @subscriptionBadgeJson,
        badges_json = @badgesJson,
        updated_at = datetime('now')
    WHERE id = @id
`);

// There was no auto-refresh before this — a share's follow/subscribe
// snapshot only ever updated if the owner re-ran the share flow by hand.
// Now it's re-pulled from Chzzk whenever the share is looked up again,
// whether that's the owner revisiting mypage or someone else (a giveaway
// host) checking the code — so the two read paths (listSharesByChannel,
// verify/batch's own lookup) both run every row through this first.
// On fetch failure, logs and returns the row as-is rather than throwing,
// so a lookup still succeeds with the last-known snapshot.
type RefreshableShare = Pick<ShareRow, "id" | "channel_id" | "stellar_id" | "follow_date" | "subscribe_month">;

export async function refreshShare<T extends RefreshableShare>(share: T): Promise<T> {
    try {
        const info = await getFollowSubscribeInfo(share.stellar_id, share.channel_id);
        if (!info) return share;
        const subscriptionBadgeJson = JSON.stringify(info.subscriptionBadge);
        const badgesJson = JSON.stringify(info.badges);
        refreshStmt.run({
            id: share.id,
            followDate: info.followDate,
            subscribeMonth: info.subscribeMonths,
            subscriptionBadgeJson,
            badgesJson
        });
        return {
            ...share,
            follow_date: info.followDate,
            subscribe_month: info.subscribeMonths,
            subscription_badge_json: subscriptionBadgeJson,
            badges_json: badgesJson
        };
    } catch (err) {
        console.error(`refreshShare(${share.id}) failed:`, err);
        return share;
    }
}
