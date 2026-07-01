import { Server } from "socket.io";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const connectedUsers = new Map();

export const initSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://fe-tutor-rho.vercel.app"],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth?.userId;
      if (!userId) return next(new Error("Missing user id"));

      const user = await User.findById(userId);
      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      socket.userName = user.name;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    connectedUsers.set(socket.userId, socket.id);

    socket.join(socket.userId);

    socket.on("join_conversation", async ({ conversationId, receiverId }) => {
      if (!conversationId) return;

      socket.join(conversationId);
      socket.emit("conversation_joined", { conversationId });

      if (receiverId) {
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("conversation_activity", {
            conversationId,
            from: socket.userId,
          });
        }
      }
    });

    socket.on(
      "send_message",
      async ({ conversationId, receiverId, content }) => {
        try {
          const text = (content || "").trim();
          if (!conversationId || !receiverId || !text) return;

          let conversation = await Conversation.findById(conversationId);
          if (!conversation) {
            conversation = await Conversation.create({
              participants: [socket.userId, receiverId].sort(),
            });
          }

          const message = await Message.create({
            conversationId: conversation._id,
            senderId: socket.userId,
            receiverId,
            content: text,
          });

          await Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: text,
            lastMessageAt: new Date(),
          });

          io.to(conversation._id.toString()).emit("new_message", {
            _id: message._id,
            conversationId: conversation._id,
            senderId: socket.userId,
            receiverId,
            content: text,
            createdAt: message.createdAt,
          });

          const receiverSocketId = connectedUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("message_received", {
              conversationId: conversation._id,
              from: socket.userId,
              content: text,
            });
          }
        } catch (error) {
          socket.emit("message_error", { error: error.message });
        }
      },
    );

    socket.on("mark_messages_read", async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversationId, receiverId: socket.userId, readAt: null },
          { $set: { readAt: new Date() } },
        );

        socket.emit("messages_read", { conversationId });
      } catch (error) {
        socket.emit("message_error", { error: error.message });
      }
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.userId);
    });
  });

  return io;
};
