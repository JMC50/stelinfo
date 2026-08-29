import express from "express";
import { requireAuth, type UserRow } from "../auth";
import { VAPID_PUBLIC_KEY } from "../config";
import { addTopic, getTopicsForEndpoint, removeTopic, upsertSubscription } from "../pushSubscriptions";

export const pushRouter = express.Router();

pushRouter.get("/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Lets the settings page restore correct toggle state on load — pass the
// endpoint of whatever subscription (if any) this browser already has.
pushRouter.get("/push/subscribe", requireAuth, (req, res) => {
    const user = res.locals.user as UserRow;
    const endpoint = req.query.endpoint;
    if (typeof endpoint !== "string" || !endpoint) {
        res.status(400).json({ error: "endpoint query param is required" });
        return;
    }

    res.json({ stellarIds: getTopicsForEndpoint(endpoint, user.channel_id) });
});

interface SubscribeBody {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    stellarId?: string;
}

pushRouter.post("/push/subscribe", requireAuth, (req, res) => {
    const user = res.locals.user as UserRow;
    const body = req.body as SubscribeBody;
    const { endpoint, keys } = body.subscription ?? {};
    const stellarId = body.stellarId;

    if (
        typeof endpoint !== "string" ||
        !endpoint ||
        typeof keys?.p256dh !== "string" ||
        typeof keys?.auth !== "string" ||
        typeof stellarId !== "string" ||
        !stellarId
    ) {
        res.status(400).json({ error: "invalid subscription payload" });
        return;
    }

    upsertSubscription({ endpoint, channelId: user.channel_id, p256dh: keys.p256dh, auth: keys.auth });
    addTopic(endpoint, stellarId);
    res.status(204).end();
});

pushRouter.delete("/push/subscribe", requireAuth, (req, res) => {
    const user = res.locals.user as UserRow;
    const { endpoint, stellarId } = (req.body ?? {}) as { endpoint?: string; stellarId?: string };
    if (typeof endpoint !== "string" || !endpoint || typeof stellarId !== "string" || !stellarId) {
        res.status(400).json({ error: "endpoint and stellarId are required" });
        return;
    }

    const removed = removeTopic(endpoint, stellarId, user.channel_id);
    if (!removed) {
        res.status(404).json({ error: "subscription not found" });
        return;
    }
    res.status(204).end();
});
