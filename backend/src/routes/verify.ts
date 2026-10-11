import express from "express";
import { requireAuth } from "../auth";
import db from "../db";
import { normalizeShareId, refreshShare } from "../shares";
import { getStreamerInfo } from "../streamerInfo";

export const verifyRouter = express.Router();

const MAX_IDS_PER_REQUEST = 200;

interface ShareWithOwner {
    id: string;
    channel_id: string;
    stellar_id: string;
    claimed_handle: string;
    follow_date: string | null;
    subscribe_month: number;
    channel_name: string;
}

const lookupStmt = db.prepare(`
    SELECT shares.id, shares.channel_id, shares.stellar_id, shares.claimed_handle, shares.follow_date,
           shares.subscribe_month, users.channel_name
    FROM shares
    JOIN users ON users.channel_id = shares.channel_id
    WHERE shares.id = ? AND shares.revoked_at IS NULL
`);

// Same "days since" convention InfoDetail.svelte uses for display — a
// follow_date of today counts as day 1, not day 0. Truncating both sides to
// midnight (rather than diffing raw elapsed ms) makes this tick over once
// per calendar day instead of once per full 24h from the exact follow time.
function followDaysSince(followDate: string): number {
    const start = new Date(followDate.replace(" ", "T"));
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return Math.round((today - startDay) / 86_400_000) + 1;
}

verifyRouter.post("/verify/batch", requireAuth, async (req, res) => {
    const { ids, minFollowDays, minSubscribeMonths, stellarId } = req.body ?? {};

    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
        res.status(400).json({ error: "ids must be an array of strings" });
        return;
    }
    if (ids.length === 0) {
        res.json([]);
        return;
    }
    if (ids.length > MAX_IDS_PER_REQUEST) {
        res.status(400).json({ error: `at most ${MAX_IDS_PER_REQUEST} ids per request` });
        return;
    }

    const minDays = typeof minFollowDays === "number" && minFollowDays > 0 ? minFollowDays : null;
    const minMonths = typeof minSubscribeMonths === "number" && minSubscribeMonths > 0 ? minSubscribeMonths : null;
    // Optional: scope the check to one stellar, so a card shared for a
    // different member's giveaway doesn't quietly pass.
    const requiredStellarId = typeof stellarId === "string" && stellarId ? stellarId : null;

    // Refresh each matched share's snapshot before scoring, so a code
    // checked long after it was shared still reflects current follow/
    // subscribe status rather than whatever it looked like at share time.
    const lookups = await Promise.all(
        ids.map(async (id) => {
            const share = lookupStmt.get(normalizeShareId(id)) as ShareWithOwner | undefined;
            return share ? [id, await refreshShare(share)] as const : [id, undefined] as const;
        })
    );

    const results = lookups.map(([id, share]) => {
        if (!share) {
            return { id, found: false as const };
        }

        const followDays = share.follow_date ? followDaysSince(share.follow_date) : 0;
        const meetsFollow = minDays === null || followDays >= minDays;
        const meetsSubscribe = minMonths === null || share.subscribe_month >= minMonths;
        const stellarMismatch = requiredStellarId !== null && share.stellar_id !== requiredStellarId;

        return {
            id,
            found: true as const,
            stellarId: share.stellar_id,
            memberName: getStreamerInfo(share.stellar_id)?.memberName ?? share.stellar_id,
            claimedHandle: share.claimed_handle,
            channelName: share.channel_name,
            followDays,
            subscribeMonth: share.subscribe_month,
            stellarMismatch,
            meetsCondition: meetsFollow && meetsSubscribe && !stellarMismatch
        };
    });

    res.json(results);
});
