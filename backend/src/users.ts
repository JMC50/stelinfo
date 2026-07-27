import db from "./db";

export interface UserRow {
    channel_id: string;
    channel_name: string;
    access_token: string;
    refresh_token: string;
    x_id: string | null;
    created_at: string;
    updated_at: string;
}

const upsertStmt = db.prepare(`
    INSERT INTO users (channel_id, channel_name, access_token, refresh_token)
    VALUES (@channelId, @channelName, @accessToken, @refreshToken)
    ON CONFLICT(channel_id) DO UPDATE SET
        channel_name = excluded.channel_name,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        updated_at = datetime('now')
`);

export function upsertUser(user: {
    channelId: string;
    channelName: string;
    accessToken: string;
    refreshToken: string;
}): void {
    upsertStmt.run(user);
}

const getByIdStmt = db.prepare(`SELECT * FROM users WHERE channel_id = ?`);

export function getUserByChannelId(channelId: string): UserRow | undefined {
    return getByIdStmt.get(channelId) as UserRow | undefined;
}

const setXIdStmt = db.prepare(
    `UPDATE users SET x_id = ?, updated_at = datetime('now') WHERE channel_id = ?`
);

/** Remembers the X ID last used for a share, so the next share form starts pre-filled with it. */
export function setUserXId(channelId: string, xId: string): void {
    setXIdStmt.run(xId, channelId);
}
