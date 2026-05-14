const jwt = require("jsonwebtoken");
const ApiError = require("./ApiError");

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessExpires = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!accessSecret || !refreshSecret) {
  throw new ApiError(500, "JWT secrets are not configured");
}

exports.signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id, role: user.role, email: user.email },
    accessSecret,
    { expiresIn: accessExpires },
  );
exports.signRefreshToken = (user) =>
  jwt.sign({ sub: user._id, tokenVersion: user.tokenVersion }, refreshSecret, {
    expiresIn: refreshExpires,
  });
exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, accessSecret);
  } catch (err) {
    throw new ApiError(401, "Invalid access token");
  }
};
exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, refreshSecret);
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token");
  }
};
