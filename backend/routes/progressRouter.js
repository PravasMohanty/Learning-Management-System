const express = require("express");
const progressRouter = express.Router();

const { authMiddleware } = require("../middlewares/authMiddleware");

const {
  initializeProgress,
  updateProgress,
  getCourseProgress,
  getMyProgress,
  toggleModuleProgress,
} = require("../controllers/courses/progressController");

progressRouter.post("/:courseId", authMiddleware, initializeProgress);

progressRouter.put("/:courseId", authMiddleware, updateProgress);

progressRouter.get("/", authMiddleware, getMyProgress);

progressRouter.get("/:courseId", authMiddleware, getCourseProgress);

// Toggle module completion
progressRouter.post("/:courseId/module/:moduleId", authMiddleware, toggleModuleProgress);

module.exports = progressRouter;
