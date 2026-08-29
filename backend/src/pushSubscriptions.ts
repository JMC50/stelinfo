import db from "./db";

export interface PushSubscriptionRow {
    endpoint: string;
    channel_id: string;
    p256dh: string;
    auth: string;
}

const upsertStmt = db.prepare(`
    INSERT INTO push_subscriptions (endpoint, channel_id, p256dh, auth)
    VALUES (@endpoint, @channelId, @p256dh, @auth)
    ON CONFLICT(endpoint) DO UPDATE SET
        channel_id = excluded.channel_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        updated_at = datetime('now')
`);

/** Registers (or refreshes) a browser's push subscription. */
export function upsertSubscription(params: {
    endpoint: string;
    channelId: string;
    p256dh: string;
    auth: string;
}): void {
    upsertStmt.run(params);
}

const addTopicStmt = db.prepare(
    `INSERT OR IGNORE INTO push_subscription_topics (endpoint, stellar_id) VALUES (?, ?)`
);

/** Opts a subscription into "방송 시작" alerts for one stellar. */
export function addTopic(endpoint: string, stellarId: string): void {
    addTopicStmt.run(endpoint, stellarId);
}

const removeTopicStmt = db.prepare(
    `DELETE FROM push_subscription_topics WHERE endpoint = ? AND stellar_id = ?`
);
const countTopicsStmt = db.prepare(
    `SELECT COUNT(*) AS count FROM push_subscription_topics WHERE endpoint = ?`
);
const deleteSubscriptionStmt = db.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`);
const ownerStmt = db.prepare(`SELECT channel_id FROM push_subscriptions WHERE endpoint = ?`);

/**
 * Opts a subscription out of one stellar's alerts. If that was its last
 * remaining topic, the subscription itself is cleaned up too rather than
 * being left around with nothing to ever notify it about. Returns false
 * (no-op) if the endpoint doesn't belong to this channel.
 */
export function removeTopic(endpoint: string, stellarId: string, channelId: string): boolean {
    const owner = ownerStmt.get(endpoint) as { channel_id: string } | undefined;
    if (!owner || owner.channel_id !== channelId) return false;

    removeTopicStmt.run(endpoint, stellarId);
    const { count } = countTopicsStmt.get(endpoint) as { count: number };
    if (count === 0) deleteSubscriptionStmt.run(endpoint);
    return true;
}

const removeAllTopicsStmt = db.prepare(`DELETE FROM push_subscription_topics WHERE endpoint = ?`);

/** Fully removes a subscription (all topics + the subscription row). */
export function deleteSubscription(endpoint: string): void {
    removeAllTopicsStmt.run(endpoint);
    deleteSubscriptionStmt.run(endpoint);
}

const subscribersForStellarStmt = db.prepare(`
    SELECT s.endpoint, s.channel_id, s.p256dh, s.auth
    FROM push_subscription_topics t
    JOIN push_subscriptions s ON s.endpoint = t.endpoint
    WHERE t.stellar_id = ?
`);

/** All subscriptions currently opted into alerts for one stellar. */
export function getSubscribersForStellar(stellarId: string): PushSubscriptionRow[] {
    return subscribersForStellarStmt.all(stellarId) as PushSubscriptionRow[];
}

const topicsForEndpointStmt = db.prepare(`
    SELECT t.stellar_id
    FROM push_subscription_topics t
    JOIN push_subscriptions s ON s.endpoint = t.endpoint
    WHERE t.endpoint = ? AND s.channel_id = ?
`);

/**
 * Which stellars this browser's subscription currently has alerts on for —
 * lets the settings page restore correct toggle state on load. Empty if the
 * endpoint doesn't exist or belongs to a different user.
 */
export function getTopicsForEndpoint(endpoint: string, channelId: string): string[] {
    const rows = topicsForEndpointStmt.all(endpoint, channelId) as Array<{ stellar_id: string }>;
    return rows.map((r) => r.stellar_id);
}
