const express = require("express");
const moduleRouter = express.Router();

const {
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
} = require("../controllers/modules/moduleController");

// Import middleware if needed
// const { authMiddleware } = require("../middlewares/authMiddleware");

// ======================================================
// MODULE ROUTES
// ======================================================

// Create module for a course
moduleRouter.post("/:courseId", createModule);

// Get all modules for a course
moduleRouter.get("/course/:courseId", getCourseModules);

// Update module
moduleRouter.put("/:moduleId", updateModule);

// Delete module
moduleRouter.delete("/:moduleId", deleteModule);

module.exports = moduleRouter;
