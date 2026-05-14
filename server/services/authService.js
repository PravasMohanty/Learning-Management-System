const crypto = require("crypto");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { sendEmail } = require("./notificationService");
const tokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});
exports.register = async (data) => {
  const user = await User.create(data);
  return { user, ...tokens(user) };
};
exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(password)))
    throw new ApiError(401, "Invalid email or password");
  if (user.status !== "active")
    throw new ApiError(403, "Account is not active");
  user.lastLoginAt = new Date();
  await user.save();
  return { user, ...tokens(user) };
};
exports.refresh = async (token) => {
  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion)
    throw new ApiError(401, "Invalid refresh token");
  return tokens(user);
};
exports.logout = async (user) => {
  user.tokenVersion += 1;
  await user.save();
};
exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return;
  const raw = crypto.randomBytes(24).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: "Reset token: " + raw,
  });
  return raw;
};
exports.resetPassword = async ({ token, password }) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password");
  if (!user) throw new ApiError(400, "Invalid or expired reset token");
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.tokenVersion += 1;
  await user.save();
};
