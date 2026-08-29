import express from "express";
import { BROADCAST_WEBHOOK_SECRET } from "../config";
import { sendBroadcastStartedNotification } from "../push";

export const webhookRouter = express.Router();

// Server-to-server call from stellar_status, not a logged-in user — auth is
// a shared secret header instead of the JWT cookie the rest of the API uses.
webhookRouter.post("/webhooks/broadcast-started", async (req, res) => {
    const secret = req.header("X-Webhook-Secret");
    if (!secret || secret !== BROADCAST_WEBHOOK_SECRET) {
        res.status(401).json({ error: "invalid webhook secret" });
        return;
    }

    const { stellarId, title, url, startedAt } = req.body ?? {};
    if (
        typeof stellarId !== "string" ||
        typeof title !== "string" ||
        typeof url !== "string" ||
        typeof startedAt !== "string"
    ) {
        res.status(400).json({ error: "invalid payload" });
        return;
    }

    try {
        await sendBroadcastStartedNotification({ stellarId, title, url, startedAt });
        res.status(202).json({ ok: true });
    } catch (err) {
        console.error("broadcast-started webhook failed:", err);
        res.status(500).json({ error: "failed to send notifications" });
    }
});
