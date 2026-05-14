const express = require("express");
const ticketService = require("../services/ticketService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await ticketService.createTicket(
        { ...req.body, user: req.user._id },
        req.app.get("io"),
      ),
    );
  }),
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await ticketService.listTickets(req.query));
  }),
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await ticketService.getTicket(req.params.id));
  }),
);

router.post(
  "/:id/reply",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(
      await ticketService.reply(
        { ticket: req.params.id, user: req.user._id, ...req.body },
        req.app.get("io"),
      ),
    );
  }),
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "instructor"),
  asyncHandler(async (req, res) => {
    res.json(
      await ticketService.setStatus(
        req.params.id,
        req.body.status,
        req.app.get("io"),
      ),
    );
  }),
);

module.exports = router;
