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
    res.json(await courseService.createModule(req.body));
  }),
);

router.put(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await courseService.updateModule(req.params.id, req.body));
  }),
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    await courseService.deleteModule(req.params.id);
    res.status(204).end();
  }),
);

module.exports = router;
