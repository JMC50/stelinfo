import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { FRONTEND_URL, PORT } from "./config";
import { authRouter } from "./routes/auth";
import { shareRouter } from "./routes/share";
import { streamerRouter } from "./routes/streamer";
import { verifyRouter } from "./routes/verify";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.get("/", (_req, res) => {
    res.send("Hello, World!");
});

app.use(authRouter);
app.use(streamerRouter);
app.use(shareRouter);
app.use(verifyRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
