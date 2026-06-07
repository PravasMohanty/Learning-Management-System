const express = require("express");
const cors = require("cors");

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// IMPORT ROUTERS
// ======================================================

const authRouter = require("../routes/authRouter");
const assignmentRouter = require("../routes/assignmentRouter");
const courseRouter = require("../routes/courseRouter");
const moduleRouter = require("../routes/moduleRouter");
const quizRouter = require("../routes/quizRouter");
const requestRouter = require("../routes/requestRouter");
const userRouter = require("../routes/userRouter");
const bulkUserRouter = require("../routes/bulkUserRouter");
const progressRouter = require("../routes/progressRouter");
const healthRouter = require("../routes/healthRouter");
const certificateRouter = require("../routes/certificateRouter");

// ======================================================
// API ROUTES
// ======================================================

// Health check
app.use("/api/health", healthRouter);

// Authentication routes
app.use("/api/auth", authRouter);

// Course routes
app.use("/api/courses", courseRouter);

// Module routes
app.use("/api/modules", moduleRouter);

// Quiz routes
app.use("/api/quiz", quizRouter);

// Assignment routes
app.use("/api/assignments", assignmentRouter);

// Request routes (registration requests)
app.use("/api/requests", requestRouter);

// User routes (profile and user management)
app.use("/api/users", userRouter);

// Bulk user routes
app.use("/api/bulk-users", bulkUserRouter);

// Progress routes
app.use("/api/progress", progressRouter);

// Certificate routes
app.use("/api/certificates", certificateRouter);

// ======================================================
// DEFAULT ROUTES
// ======================================================

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;