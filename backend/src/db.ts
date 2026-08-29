import path from "node:path";
import Database from "better-sqlite3";

// Single-file SQLite store living next to the backend package (gitignored).
// Replaces the old in-memory-only session Map now that logins and shares
// both need to survive a server restart.
const db = new Database(path.join(__dirname, "..", "data.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        channel_id TEXT PRIMARY KEY,
        channel_name TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        x_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        stellar_id TEXT NOT NULL,
        claimed_handle TEXT NOT NULL,
        follow_date TEXT,
        subscribe_month INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        revoked_at TEXT,
        UNIQUE (channel_id, stellar_id)
    );

    -- One row per browser's push subscription (endpoint is unique per
    -- browser install, so it doubles as the natural primary key).
    CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Which stellars a given subscription wants "방송 시작" alerts for.
    -- No formal FK (this project doesn't use them elsewhere either) —
    -- cleanup happens in application code alongside the subscription row.
    CREATE TABLE IF NOT EXISTS push_subscription_topics (
        endpoint TEXT NOT NULL,
        stellar_id TEXT NOT NULL,
        PRIMARY KEY (endpoint, stellar_id)
    );
`);

// x_id was added after the users table already shipped — backfill it for
// any DB file created before this column existed.
const userColumns = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
if (!userColumns.some((c) => c.name === "x_id")) {
    db.exec(`ALTER TABLE users ADD COLUMN x_id TEXT`);
}

export default db;
