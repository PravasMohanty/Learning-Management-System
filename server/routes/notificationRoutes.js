const express = require("express");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await Notification.find({ user: req.user._id }).sort("-createdAt"),
    );
  }),
);

router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await notificationService.createNotification(
        req.user._id,
        req.body,
        req.app.get("io"),
      ),
    );
  }),
);

module.exports = router;
