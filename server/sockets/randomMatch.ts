import { Server, Socket } from "socket.io";

import {
  waitingQueue,
  activeRooms,
  onlineUsers,
  recentSkips,
} from "../memory/store";

import { findBestMatch } from "../services/matchmaking";

import { generateRoomId } from "../utils/helpers";

import Conversation from "../models/Conversation";

import Message from "../models/Message";

// =========================
// ADD USER TO QUEUE
// =========================
const addToQueue = (
  socketId: string
) => {
  const currentUser =
    onlineUsers.get(socketId);

  if (!currentUser) return;

  // prevent duplicate queue
  const exists =
    waitingQueue.find(
      (u) =>
        u.socketId === socketId
    );

  if (exists) return;

  waitingQueue.push({
    socketId,
    username:
      currentUser.username,
    interests:
      currentUser.interests,
  });

  console.log(
    "⏳ QUEUED:",
    currentUser.username
  );
};

// =========================
// TRY MATCH USER
// =========================
const tryMatchUser = async (
  io: Server,
  socketId: string
) => {
  const currentUser =
    onlineUsers.get(socketId);

  if (!currentUser) return;

  const partner =
    findBestMatch(
      socketId,
      currentUser.interests
    );

  // no partner
  if (!partner) {
    addToQueue(socketId);

    io.to(socketId).emit(
      "searching"
    );

    return;
  }

  // remove partner from queue
  const partnerIndex =
    waitingQueue.findIndex(
      (u) =>
        u.socketId ===
        partner.socketId
    );

  if (partnerIndex !== -1) {
    waitingQueue.splice(
      partnerIndex,
      1
    );
  }

  // remove current user too
  const currentIndex =
    waitingQueue.findIndex(
      (u) =>
        u.socketId === socketId
    );

  if (currentIndex !== -1) {
    waitingQueue.splice(
      currentIndex,
      1
    );
  }

  const roomId =
    generateRoomId();

  const currentSocket =
    io.sockets.sockets.get(
      socketId
    );

  const partnerSocket =
    io.sockets.sockets.get(
      partner.socketId
    );

  if (
    !currentSocket ||
    !partnerSocket
  ) {
    return;
  }

  currentSocket.join(roomId);

  partnerSocket.join(roomId);

  activeRooms.set(roomId, [
    socketId,
    partner.socketId,
  ]);

  // save conversation
  await Conversation.create({
    roomId,
    participants: [
      currentUser.username,
      partner.username,
    ],
    isRandom: true,
  });

  const commonInterests =
    currentUser.interests.filter(
      (i) =>
        partner.interests.includes(
          i
        )
    );

  console.log(
    "🎉 MATCHED:",
    currentUser.username,
    "<->",
    partner.username
  );

  io.to(roomId).emit(
    "matched",
    {
      roomId,
      users: [
        currentUser.username,
        partner.username,
      ],
      commonInterests,
    }
  );
};

// =========================
// MAIN HANDLER
// =========================
export const randomMatchHandler = (
  io: Server,
  socket: Socket
) => {
  // =========================
  // FIND PARTNER
  // =========================
  socket.on(
    "findPartner",
    async () => {
      console.log(
        "🔍 FIND PARTNER:",
        socket.id
      );

      await tryMatchUser(
        io,
        socket.id
      );
    }
  );

  // =========================
  // RANDOM MESSAGE
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
        onlineUsers.get(
          socket.id
        );

      if (!currentUser) return;

      // save message
      await Message.create({
        roomId,
        sender:
          currentUser.username,
        text: message,
      });

      // emit to BOTH
      io.to(roomId).emit(
        "randomMessage",
        {
          user:
            currentUser.username,
          message,
        }
      );
    }
  );

  // =========================
  // SKIP PARTNER
  // =========================
  socket.on(
    "skipPartner",
    async (
      roomId: string
    ) => {
      const roomUsers =
        activeRooms.get(
          roomId
        );

      if (!roomUsers) return;

      const partnerId =
        roomUsers.find(
          (id) =>
            id !== socket.id
        );

      if (!partnerId) return;

      // =====================
      // STORE SKIPS
      // =====================
      if (
        !recentSkips.has(
          socket.id
        )
      ) {
        recentSkips.set(
          socket.id,
          new Set()
        );
      }

      if (
        !recentSkips.has(
          partnerId
        )
      ) {
        recentSkips.set(
          partnerId,
          new Set()
        );
      }

      recentSkips
        .get(socket.id)
        ?.add(partnerId);

      recentSkips
        .get(partnerId)
        ?.add(socket.id);

      // =====================
      // CLEAN ROOM
      // =====================
      activeRooms.delete(
        roomId
      );

      socket.leave(roomId);

      io.sockets.sockets
        .get(partnerId)
        ?.leave(roomId);

      // end conversation
      await Conversation.findOneAndUpdate(
        { roomId },
        {
          endedAt:
            new Date(),
        }
      );

      console.log(
        "⏭️ SKIPPED:",
        socket.id,
        "<->",
        partnerId
      );

      // =====================
      // RESET BOTH
      // =====================
      io.to(socket.id).emit(
        "partnerSkipped"
      );

      io.to(partnerId).emit(
        "partnerSkipped"
      );

      // =====================
      // AUTO REQUEUE
      // =====================
      await tryMatchUser(
        io,
        socket.id
      );

      await tryMatchUser(
        io,
        partnerId
      );

      // =====================
      // CLEAR SKIP MEMORY
      // after 2 minutes
      // =====================
      setTimeout(() => {
        recentSkips
          .get(socket.id)
          ?.delete(
            partnerId
          );

        recentSkips
          .get(partnerId)
          ?.delete(
            socket.id
          );
      }, 1000 * 60 * 2);
    }
  );
};
