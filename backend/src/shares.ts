import crypto from "node:crypto";
import db from "./db";

export interface ShareRow {
    id: string;
    channel_id: string;
    stellar_id: string;
    claimed_handle: string;
    follow_date: string | null;
    subscribe_month: number;
    created_at: string;
    updated_at: string;
    revoked_at: string | null;
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
    INSERT INTO shares (id, channel_id, stellar_id, claimed_handle, follow_date, subscribe_month)
    VALUES (@id, @channelId, @stellarId, @claimedHandle, @followDate, @subscribeMonth)
`);

const updateStmt = db.prepare(`
    UPDATE shares
    SET claimed_handle = @claimedHandle,
        follow_date = @followDate,
        subscribe_month = @subscribeMonth,
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
}): string {
    const existing = findExistingStmt.get(params.channelId, params.stellarId) as
        | { id: string }
        | undefined;

    if (existing) {
        updateStmt.run({ ...params, id: existing.id });
        return existing.id;
    }

    const id = generateShareId();
    insertStmt.run({ ...params, id });
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
