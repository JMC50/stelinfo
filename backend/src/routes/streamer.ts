import express from "express";
import { getLatestBroadcast } from "../chzzkBroadcast";
import { getFollowSubscribeInfo } from "../chzzkProfile";
import { requireAuth, type Session } from "../session";
import { getStreamerInfo } from "../streamerInfo";
import { getStellarYoutubeSummary } from "../youtube";

export const streamerRouter = express.Router();

streamerRouter.get("/streamer-info/:stellarId", requireAuth, async (req: express.Request<{ stellarId: string }>, res) => {
    const session = res.locals.session as Session;

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
        getFollowSubscribeInfo(req.params.stellarId, session.user.channelId).catch((err) => {
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
        subscribe_month: followSubscribe?.subscribeMonths ?? 0
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
