const express = require("express");
const progressRouter = express.Router();

const { authMiddleware } = require("../middlewares/authMiddleware");

const {
  initializeProgress,
  updateProgress,
  getCourseProgress,
  getMyProgress,
} = require("../controllers/courses/progressController");

progressRouter.post("/:courseId", authMiddleware, initializeProgress);

progressRouter.put("/:courseId", authMiddleware, updateProgress);

progressRouter.get("/", authMiddleware, getMyProgress);

progressRouter.get("/:courseId", authMiddleware, getCourseProgress);

module.exports = progressRouter;
