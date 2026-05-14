const express = require("express");
const quizService = require("../services/quizService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await quizService.createQuiz(req.body));
  }),
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await quizService.updateQuiz(req.params.id, req.body));
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await quizService.listQuizzes(req.query));
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await quizService.getQuiz(req.params.id));
  }),
);

router.post(
  "/:id/attempt",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await quizService.submitAttempt(
        {
          quizId: req.params.id,
          student: req.user._id,
          answers: req.body.answers,
        },
        req.app.get("io"),
      ),
    );
  }),
);

module.exports = router;
