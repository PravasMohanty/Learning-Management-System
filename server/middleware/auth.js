const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");
const { verifyAccessToken } = require("../utils/jwt");

exports.authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
      ? header.slice(7)
      : req.cookies?.accessToken;
    if (!token) throw new ApiError(401, "Authentication required");
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("+password");
    if (!user || user.status !== "active")
      throw new ApiError(401, "Invalid or suspended account");
    req.user = user;
    logger.debug("User authenticated", { userId: user._id, role: user.role });
    next();
  } catch (err) {
    logger.warn("Authentication failed", { error: err.message });
    next(err.statusCode ? err : new ApiError(401, "Invalid token"));
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (roles.includes(req.user?.role)) {
    logger.debug("Authorization granted", { userId: req.user._id, role: req.user.role });
    return next();
  }
  logger.warn("Authorization denied", { userId: req.user?._id, requiredRoles: roles, userRole: req.user?.role });
  next(new ApiError(403, "Insufficient permissions"));
};

exports.requireOwnership = (resourceUserId) => (req, res, next) => {
  if (String(req.user._id) === String(resourceUserId) || req.user.role === "admin") {
    return next();
  }
  logger.warn("Ownership check failed", { userId: req.user._id, resourceUserId });
  next(new ApiError(403, "Cannot modify this resource"));
};
