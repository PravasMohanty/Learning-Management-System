const express = require("express");
const dashboardService = require("../services/dashboardService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await dashboardService.adminDashboard());
  }),
);

router.get(
  "/analytics",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await dashboardService.courseAnalytics());
  }),
);

module.exports = router;
