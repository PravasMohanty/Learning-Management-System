const express = require("express");
const courseService = require("../services/courseService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await courseService.createLesson(req.body));
  }),
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await courseService.updateLesson(req.params.id, req.body));
  }),
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    await courseService.deleteLesson(req.params.id);
    res.status(204).end();
  }),
);

router.post(
  "/:id/comment",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await courseService.addComment(
        req.params.id,
        req.user._id,
        req.body.text,
      ),
    );
  }),
);

module.exports = router;
