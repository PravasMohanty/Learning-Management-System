const express = require("express");
const Review = require("../models/Review");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await Review.find(req.query).sort("-createdAt"));
  }),
);

router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await Review.create({ ...req.body, student: req.user._id }));
  }),
);

router.put(
  "/:id/approve",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(
      await Review.findByIdAndUpdate(
        req.params.id,
        { approved: true },
        { new: true },
      ),
    );
  }),
);

module.exports = router;
