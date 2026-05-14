const express = require("express");
const progressService = require("../services/progressService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await progressService.getStudentDashboard(req.user._id));
  }),
);

router.get(
  "/course/:courseId",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await progressService.getCourseProgress(
        req.user._id,
        req.params.courseId,
      ),
    );
  }),
);

router.post(
  "/lesson",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await progressService.markLesson(
        {
          student: req.user._id,
          course: req.body.course,
          lesson: req.body.lesson,
          watchSeconds: req.body.watchSeconds,
        },
        req.app.get("io"),
      ),
    );
  }),
);

module.exports = router;
