const express = require("express");
const chatbotService = require("../services/chatbotService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/course/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await chatbotService.setCourseChatbot(req.params.id, req.body));
  }),
);

router.post(
  "/answer",
  asyncHandler(async (req, res) => {
    res.json(
      await chatbotService.answer({
        courseId: req.body.courseId,
        message: req.body.message,
      }),
    );
  }),
);

module.exports = router;
