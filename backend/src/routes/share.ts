import express from "express";
import { requireAuth, type UserRow } from "../auth";
import { getFollowSubscribeInfo } from "../chzzkProfile";
import {
    getShareById,
    listSharesByChannel,
    parseBadges,
    parseSubscriptionBadge,
    refreshShare,
    revokeShare,
    upsertShare
} from "../shares";
import { getStreamerInfo } from "../streamerInfo";
import { setUserXId } from "../users";

export const shareRouter = express.Router();

const MAX_HANDLE_LENGTH = 40;

function serializeShare(share: {
    id: string;
    stellar_id: string;
    claimed_handle: string;
    follow_date: string | null;
    subscribe_month: number;
    subscription_badge_json: string | null;
    badges_json: string | null;
    created_at: string;
    updated_at: string;
}) {
    const info = getStreamerInfo(share.stellar_id);
    return {
        id: share.id,
        stellarId: share.stellar_id,
        memberName: info?.memberName ?? share.stellar_id,
        claimedHandle: share.claimed_handle,
        followDate: share.follow_date,
        subscribeMonth: share.subscribe_month,
        subscriptionBadge: parseSubscriptionBadge(share.subscription_badge_json),
        badges: parseBadges(share.badges_json),
        createdAt: share.created_at,
        updatedAt: share.updated_at
    };
}

shareRouter.post(
    "/streamer-info/:stellarId/share",
    requireAuth,
    async (req: express.Request<{ stellarId: string }>, res) => {
        const user = res.locals.user as UserRow;
        const stellarId = req.params.stellarId;

        if (!getStreamerInfo(stellarId)) {
            res.status(404).json({ error: "no data for this stellar" });
            return;
        }

        const claimedHandle = typeof req.body?.claimedHandle === "string" ? req.body.claimedHandle.trim() : "";
        if (!claimedHandle) {
            res.status(400).json({ error: "claimedHandle is required" });
            return;
        }
        if (claimedHandle.length > MAX_HANDLE_LENGTH) {
            res.status(400).json({ error: `claimedHandle must be ${MAX_HANDLE_LENGTH} characters or fewer` });
            return;
        }

        try {
            // Re-read live follow/subscribe status from Chzzk rather than
            // trusting anything the client sent — this snapshot is the
            // whole point of the verification feature downstream.
            const followSubscribe = await getFollowSubscribeInfo(stellarId, user.channel_id);

            const id = upsertShare({
                channelId: user.channel_id,
                stellarId,
                claimedHandle,
                followDate: followSubscribe?.followDate ?? null,
                subscribeMonth: followSubscribe?.subscribeMonths ?? 0,
                subscriptionBadge: followSubscribe?.subscriptionBadge ?? null,
                badges: followSubscribe?.badges ?? []
            });
            // Remembered per-user (not per-share) so the next share form —
            // for any stellar — starts pre-filled with whatever was typed
            // most recently.
            setUserXId(user.channel_id, claimedHandle);

            const share = getShareById(id);
            if (!share) throw new Error("share vanished immediately after upsert");
            res.json(serializeShare(share));
        } catch (err) {
            console.error("share creation failed:", err);
            res.status(502).json({ error: "failed to fetch follow/subscribe data" });
        }
    }
);

shareRouter.get("/share/:id", async (req: express.Request<{ id: string }>, res) => {
    const share = getShareById(req.params.id);
    if (!share || share.revoked_at) {
        res.status(404).json({ error: "share not found" });
        return;
    }
    const fresh = await refreshShare(share);
    res.json(serializeShare(fresh));
});

shareRouter.get("/me/shares", requireAuth, async (_req, res) => {
    const user = res.locals.user as UserRow;
    const shares = listSharesByChannel(user.channel_id).filter((s) => !s.revoked_at);
    const refreshed = await Promise.all(shares.map(refreshShare));
    res.json(refreshed.map(serializeShare));
});

shareRouter.delete("/me/shares/:id", requireAuth, (req: express.Request<{ id: string }>, res) => {
    const user = res.locals.user as UserRow;
    const revoked = revokeShare(req.params.id, user.channel_id);
    if (!revoked) {
        res.status(404).json({ error: "share not found" });
        return;
    }
    res.status(204).end();
});
