const express = require("express");
const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    res.json(await authService.register(req.body));
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    res.json(await authService.login(req.body));
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    res.json(
      await authService.refresh(
        req.body.refreshToken || req.cookies?.refreshToken,
      ),
    );
  }),
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logout(req.user);
    res.json({ success: true, message: "Logged out" });
  }),
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.json({
      success: true,
      message: "Reset email sent if the account exists",
    });
  }),
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body);
    res.json({ success: true, message: "Password has been reset" });
  }),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.user });
  }),
);

module.exports = router;
