import express from "express";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { verifyTokenAndRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/conversations", verifyTokenAndRole([]), async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .lean();

    const enriched = await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipantId = conversation.participants.find(
          (id) => id.toString() !== userId.toString(),
        );

        const [otherUser, unreadCount] = await Promise.all([
          otherParticipantId
            ? (await import("../models/User.js")).default
                .findById(otherParticipantId)
                .select("name profileImage role")
            : null,
          Message.countDocuments({
            conversationId: conversation._id,
            receiverId: userId,
            readAt: null,
          }),
        ]);

        return {
          ...conversation,
          otherUser,
          unreadCount,
        };
      }),
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get(
  "/conversations/:conversationId/messages",
  verifyTokenAndRole([]),
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        return res
          .status(404)
          .json({ success: false, error: "Conversation not found." });
      }

      const messages = await Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .lean();

      await Message.updateMany(
        { conversationId, receiverId: userId, readAt: null },
        { $set: { readAt: new Date() } },
      );

      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

router.post("/conversations", verifyTokenAndRole([]), async (req, res) => {
  try {
    const { receiverId } = req.body;
    const userId = req.user._id;

    if (!receiverId || receiverId === userId.toString()) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid receiver." });
    }

    const participants = [userId, receiverId].sort();
    let conversation = await Conversation.findOne({ participants });

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        lastMessage: "",
        lastMessageAt: new Date(),
      });
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
