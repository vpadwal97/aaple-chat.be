import { Server, Socket } from "socket.io";

import {
  onlineUsers,
  waitingQueue,
  activeRooms,
} from "../memory/store";

import { randomMatchHandler } from "./randomMatch";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("🟢 CONNECTED:", socket.id);

    // =========================
    // JOIN
    // =========================
    socket.on(
      "join",
      ({
        username,
        interests,
      }: {
        username: string;
        interests: string[];
      }) => {
        onlineUsers.set(socket.id, {
          username,
          interests,
        });

        console.log(
          "👤 USER JOINED:",
          username
        );

        io.emit(
          "onlineUsers",
          Array.from(
            onlineUsers.entries()
          )
        );
      }
    );

    // =========================
    // RANDOM MATCH EVENTS
    // =========================
    randomMatchHandler(io, socket);

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      console.log(
        "🔴 DISCONNECTED:",
        socket.id
      );

      onlineUsers.delete(socket.id);

      // remove queue
      const index =
        waitingQueue.findIndex(
          (u) => u.socketId === socket.id
        );

      if (index !== -1) {
        waitingQueue.splice(index, 1);
      }

      // cleanup rooms
      for (const [
        roomId,
        users,
      ] of activeRooms.entries()) {
        if (users.includes(socket.id)) {
          const partner = users.find(
            (id) => id !== socket.id
          );

          if (partner) {
            io.to(partner).emit(
              "partnerLeft"
            );
          }

          activeRooms.delete(roomId);
        }
      }

      io.emit(
        "onlineUsers",
        Array.from(
          onlineUsers.entries()
        )
      );
    });
  });
};
