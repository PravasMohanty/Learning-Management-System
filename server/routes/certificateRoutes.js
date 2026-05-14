const express = require("express");
const certificateService = require("../services/certificateService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/issue",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(await certificateService.issue(req.body));
  }),
);

router.get(
  "/verify/:verificationId",
  asyncHandler(async (req, res) => {
    res.json(await certificateService.verify(req.params.verificationId));
  }),
);

router.get(
  "/download/:id",
  asyncHandler(async (req, res) => {
    await certificateService.streamPdf(req.params.id, res);
  }),
);

module.exports = router;
