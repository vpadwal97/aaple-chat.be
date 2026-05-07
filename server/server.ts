import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

import { connectDB } from "./config/db";
import { socketHandler } from "./sockets";

dotenv.config();

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

connectDB();

// =========================
// HEALTH CHECK
// =========================
app.get("/", (_, res) => {
  res.send("🚀 Server Running");
});

// =========================
// SOCKETS
// =========================
socketHandler(io);

// =========================
// START
// =========================
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
