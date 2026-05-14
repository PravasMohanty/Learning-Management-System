const express = require("express");
const userService = require("../services/userService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await userService.listUsers(req.query));
  }),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.user });
  }),
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await userService.createUser(req.body));
  }),
);

router.put(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await userService.updateUser(req.user._id, req.body));
  }),
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await userService.updateUser(req.params.id, req.body));
  }),
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(204).end();
  }),
);

router.put(
  "/:id/suspend",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    res.json(await userService.suspendUser(req.params.id));
  }),
);

module.exports = router;
