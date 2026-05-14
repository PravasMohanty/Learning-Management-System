require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || true,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "LMS WhatsApp API healthy" }),
);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/modules", require("./routes/moduleRoutes"));
app.use("/api/lessons", require("./routes/lessonRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/campaigns", require("./routes/campaignRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/certificates", require("./routes/certificateRoutes"));
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);
app.use(errorHandler);
module.exports = app;
