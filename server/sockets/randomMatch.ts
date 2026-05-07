import { Server, Socket } from "socket.io";

import {
  waitingQueue,
  activeRooms,
  onlineUsers,
} from "../memory/store";

import { findBestMatch } from "../services/matchmaking";

import { generateRoomId } from "../utils/helpers";

import Conversation from "../models/Conversation";

import Message from "../models/Message";

export const randomMatchHandler = (
  io: Server,
  socket: Socket
) => {
  // =========================
  // FIND PARTNER
  // =========================
  socket.on("findPartner", async () => {
    const currentUser = onlineUsers.get(socket.id);

    if (!currentUser) return;

    console.log(
      "🔍 FIND PARTNER:",
      currentUser.username
    );

    // prevent duplicate queue
    const alreadyQueued = waitingQueue.find(
      (u) => u.socketId === socket.id
    );

    if (alreadyQueued) {
      return;
    }

    // =========================
    // FIND BEST MATCH
    // =========================
    const partner = findBestMatch(
      currentUser.interests
    );

    // =========================
    // MATCH FOUND
    // =========================
    if (partner) {
      // remove partner from queue
      const partnerIndex =
        waitingQueue.findIndex(
          (u) => u.socketId === partner.socketId
        );

      if (partnerIndex !== -1) {
        waitingQueue.splice(partnerIndex, 1);
      }

      const roomId = generateRoomId();

      socket.join(roomId);

      const partnerSocket =
        io.sockets.sockets.get(partner.socketId);

      if (!partnerSocket) {
        return;
      }

      partnerSocket.join(roomId);

      activeRooms.set(roomId, [
        socket.id,
        partner.socketId,
      ]);

      // =========================
      // SAVE CONVERSATION
      // =========================
      await Conversation.create({
        roomId,
        participants: [
          currentUser.username,
          partner.username,
        ],
        isRandom: true,
      });

      console.log(
        "🎉 MATCHED:",
        currentUser.username,
        "WITH",
        partner.username
      );

      io.to(roomId).emit("matched", {
        roomId,
        users: [
          currentUser.username,
          partner.username,
        ],
        commonInterests:
          currentUser.interests.filter((i) =>
            partner.interests.includes(i)
          ),
      });
    }

    // =========================
    // NO MATCH
    // =========================
    else {
      waitingQueue.push({
        socketId: socket.id,
        username: currentUser.username,
        interests: currentUser.interests,
      });

      console.log(
        "⏳ ADDED TO QUEUE:",
        currentUser.username
      );
    }
  });

  // =========================
  // SEND RANDOM MESSAGE
  // =========================
  socket.on(
    "randomMessage",
    async ({
      roomId,
      message,
    }: {
      roomId: string;
      message: string;
    }) => {
      const currentUser =
        onlineUsers.get(socket.id);

      if (!currentUser) return;

      // save message
      await Message.create({
        roomId,
        sender: currentUser.username,
        text: message,
      });

      socket.to(roomId).emit(
        "randomMessage",
        {
          user: currentUser.username,
          message,
        }
      );
    }
  );

  // =========================
  // SKIP / LEAVE
  // =========================
  socket.on(
    "leaveRandom",
    async (roomId: string) => {
      const roomUsers =
        activeRooms.get(roomId);

      if (!roomUsers) return;

      const partnerId = roomUsers.find(
        (id) => id !== socket.id
      );

      if (partnerId) {
        io.to(partnerId).emit(
          "partnerLeft"
        );
      }

      activeRooms.delete(roomId);

      await Conversation.findOneAndUpdate(
        { roomId },
        {
          endedAt: new Date(),
        }
      );

      console.log("🚪 ROOM CLOSED:", roomId);
    }
  );
};
