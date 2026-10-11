import express from "express";
import { requireAuth, type UserRow } from "../auth";
import { getLatestBroadcast } from "../chzzkBroadcast";
import { getFollowSubscribeInfo } from "../chzzkProfile";
import { getStreamerInfo } from "../streamerInfo";
import { getStellarYoutubeSummary } from "../youtube";

export const streamerRouter = express.Router();

streamerRouter.get("/streamer-info/:stellarId", requireAuth, async (req: express.Request<{ stellarId: string }>, res) => {
    const user = res.locals.user as UserRow;

    const info = getStreamerInfo(req.params.stellarId);
    if (!info) {
        res.status(404).json({ error: "no data for this stellar" });
        return;
    }

    const [broadcast, followSubscribe] = await Promise.all([
        getLatestBroadcast(req.params.stellarId).catch((err) => {
            console.error("broadcast fetch failed:", err);
            return null;
        }),
        getFollowSubscribeInfo(req.params.stellarId, user.channel_id).catch((err) => {
            console.error("follow/subscribe fetch failed:", err);
            return null;
        })
    ]);

    res.json({
        ...info,
        last_stream_date: broadcast?.date ?? "",
        last_stream_title: broadcast?.title ?? "",
        last_stream_url: broadcast?.url ?? "",
        is_live: broadcast?.isLive ?? false,
        follow_date: followSubscribe?.followDate ?? null,
        subscribe_month: followSubscribe?.subscribeMonths ?? 0,
        subscription_badge: followSubscribe?.subscriptionBadge ?? null,
        badges: followSubscribe?.badges ?? []
    });
});

streamerRouter.get("/youtube/:stellarId", async (req, res) => {
    try {
        const summary = await getStellarYoutubeSummary(req.params.stellarId);
        if (!summary) {
            res.status(404).json({ error: "no youtube data for this stellar" });
            return;
        }
        res.json(summary);
    } catch (err) {
        console.error("youtube summary fetch failed:", err);
        res.status(502).json({ error: "failed to fetch youtube data" });
    }
});
