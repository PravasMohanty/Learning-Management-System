const express = require("express");
const whatsappService = require("../services/whatsappService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await whatsappService.createCampaign(req.body));
  }),
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await whatsappService.listCampaigns());
  }),
);

router.post(
  "/:id/send",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(
      await whatsappService.sendCampaign(req.params.id, req.app.get("io")),
    );
  }),
);

router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    res.json(await whatsappService.webhook(req.body, req.app.get("io")));
  }),
);

router.get(
  "/analytics",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await whatsappService.analytics());
  }),
);

module.exports = router;
