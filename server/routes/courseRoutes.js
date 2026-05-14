const express = require("express");
const courseService = require("../services/courseService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await courseService.listCourses(req.query));
  }),
);

router.post(
  "/",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(
      await courseService.createCourse({
        ...req.body,
        instructor: req.user._id,
      }),
    );
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await courseService.getCourseDetail(req.params.id));
  }),
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await courseService.updateCourse(req.params.id, req.body));
  }),
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    await courseService.deleteCourse(req.params.id);
    res.status(204).end();
  }),
);

router.post(
  "/:id/publish",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(
      await courseService.publishCourse(
        req.params.id,
        req.body.isPublished === true || req.body.isPublished === "true",
      ),
    );
  }),
);

router.post(
  "/:id/enroll",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await courseService.enroll(req.user._id, req.params.id));
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
