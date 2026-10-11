import express from "express";

export const badgeImageRouter = express.Router();

// Badge images are served from pstatic.net without permissive CORS
// headers, so html-to-image (used by the share card's "save as image"
// button) can't embed them cross-origin — it needs same-origin (or
// CORS-enabled) images to rasterize. This re-serves them from our own
// origin instead. Public (no auth) since badge images aren't sensitive,
// but restricted to Chzzk/Naver's own badge asset hosts so this can't
// become an open image-fetching relay.
const ALLOWED_HOSTS = new Set(["ssl.pstatic.net", "nng-phinf.pstatic.net"]);

badgeImageRouter.get("/badge-image", async (req, res) => {
    const raw = req.query.url;
    if (typeof raw !== "string") {
        res.status(400).json({ error: "url is required" });
        return;
    }

    let target: URL;
    try {
        target = new URL(raw);
    } catch {
        res.status(400).json({ error: "invalid url" });
        return;
    }

    if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
        res.status(400).json({ error: "url host not allowed" });
        return;
    }

    try {
        const upstream = await fetch(target.toString());
        if (!upstream.ok) {
            res.status(502).json({ error: "upstream fetch failed" });
            return;
        }
        const contentType = upstream.headers.get("content-type") ?? "image/png";
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.setHeader("Content-Type", contentType);
        // These are static badge assets — fine to cache aggressively.
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
        res.send(buf);
    } catch (err) {
        console.error("badge image proxy failed:", err);
        res.status(502).json({ error: "upstream fetch failed" });
    }
});
