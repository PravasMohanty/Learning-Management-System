const crypto = require("crypto");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/response");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { validatePassword, hashPassword } = require("./passwordService");
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require("./emailService");
const logger = require("../config/logger");

exports.register = async (data) => {
  const { email, password, name, phone, role } = data;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const validation = validatePassword(password);
  if (!validation.valid) throw new ApiError(422, "Password too weak", { errors: validation.errors });

  const hashedPassword = await hashPassword(password);

  const emailVerificationToken = crypto.randomBytes(24).toString("hex");
  const emailVerificationTokenHash = crypto.createHash("sha256").update(emailVerificationToken).digest("hex");

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: role || "student",
    status: "pending",
    emailVerificationToken: emailVerificationTokenHash,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${emailVerificationToken}`;
  await sendVerificationEmail(user, verificationLink);

  logger.info("User registered", { userId: user._id, email: user.email });

  return {
    success: true,
    message: "Registration successful. Please verify your email.",
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
  };
};

exports.verifyEmail = async (token) => {
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired verification token");

  user.status = "active";
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  user.approvedAt = new Date();
  await user.save();

  await sendWelcomeEmail(user);
  logger.info("Email verified", { userId: user._id });

  return { success: true, message: "Email verified successfully" };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new ApiError(403, "Account not active. Please verify your email.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };

  logger.info("User logged in", { userId: user._id, email: user.email });

  return {
    user: user.toObject(),
    ...tokens,
  };
};

exports.refresh = async (token) => {
  if (!token) throw new ApiError(401, "Refresh token required");

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub);

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new ApiError(401, "Invalid refresh token");
  }

  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
};

exports.logout = async (user) => {
  user.tokenVersion += 1;
  await user.save();
  logger.info("User logged out", { userId: user._id });
  return { success: true, message: "Logged out successfully" };
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { success: true, message: "If account exists, reset email will be sent" };
  }

  const raw = crypto.randomBytes(24).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${raw}`;
  await sendPasswordResetEmail(user, resetLink);

  logger.info("Password reset email sent", { email: user.email });

  return { success: true, message: "If account exists, reset email will be sent" };
};

exports.resetPassword = async ({ token, password }) => {
  const validation = validatePassword(password);
  if (!validation.valid) throw new ApiError(422, "Password too weak", { errors: validation.errors });

  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) throw new ApiError(400, "Invalid or expired reset token");

  user.password = await hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.tokenVersion += 1;
  await user.save();

  logger.info("Password reset successful", { userId: user._id });

  return { success: true, message: "Password reset successfully" };
};

exports.getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

exports.updateProfile = async (userId, data) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { name: data.name, phone: data.phone, bio: data.bio },
    { new: true, runValidators: true }
  );

  if (!user) throw new ApiError(404, "User not found");

  logger.info("Profile updated", { userId });
  return user;
};
