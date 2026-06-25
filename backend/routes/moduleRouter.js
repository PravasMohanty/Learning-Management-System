const express = require("express");
const moduleRouter = express.Router();

const {
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
} = require("../controllers/modules/moduleController");

const {
  addVideo,
  updateVideo,
  deleteVideo,
} = require("../controllers/modules/moduleVideoController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// MODULE ROUTES
// ======================================================

// Create module for a course (admin only)
moduleRouter.post("/:courseId", authMiddleware, adminMiddleware, createModule);

// Get all modules for a course (public)
moduleRouter.get("/course/:courseId", getCourseModules);

// Update module (admin only)
moduleRouter.put("/:moduleId", authMiddleware, adminMiddleware, updateModule);

// Delete module (admin only)
moduleRouter.delete("/:moduleId", authMiddleware, adminMiddleware, deleteModule);

// ======================================================
// MODULE VIDEOS ROUTES
// ======================================================

// Add video to module (admin only)
moduleRouter.post("/:moduleId/videos", authMiddleware, adminMiddleware, addVideo);

// Update video (admin only)
moduleRouter.put("/videos/:videoId", authMiddleware, adminMiddleware, updateVideo);

// Delete video (admin only)
moduleRouter.delete("/videos/:videoId", authMiddleware, adminMiddleware, deleteVideo);

module.exports = moduleRouter;
