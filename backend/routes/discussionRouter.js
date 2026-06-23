const express = require("express");
const discussionRouter = express.Router();

const {
  createDiscussion,
  getCourseDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  deleteReply,
  markResolved,
  toggleLock,
} = require("../controllers/discussions/discussionController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// DISCUSSION ROUTES
// ======================================================

// Create a new discussion (auth required)
discussionRouter.post("/", authMiddleware, createDiscussion);

// Get all discussions for a course (auth required)
discussionRouter.get("/course/:courseId", authMiddleware, getCourseDiscussions);

// Get single discussion with replies (auth required)
discussionRouter.get("/:discussionId", authMiddleware, getDiscussionById);

// Update discussion (auth required, author only)
discussionRouter.put("/:discussionId", authMiddleware, updateDiscussion);

// Delete discussion (auth required, author or admin)
discussionRouter.delete("/:discussionId", authMiddleware, deleteDiscussion);

// Add reply to discussion (auth required)
discussionRouter.post("/:discussionId/replies", authMiddleware, addReply);

// Delete reply (auth required, author or admin)
discussionRouter.delete("/replies/:replyId", authMiddleware, deleteReply);

// Mark discussion as resolved (admin only)
discussionRouter.put("/:discussionId/resolve", authMiddleware, adminMiddleware, markResolved);

// Toggle lock on discussion (admin only)
discussionRouter.put("/:discussionId/lock", authMiddleware, adminMiddleware, toggleLock);

module.exports = discussionRouter;
