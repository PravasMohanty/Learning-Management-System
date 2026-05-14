const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { ROLES, USER_STATUS, PAGINATION } = require("../constants");
const { pageParams, searchRegex } = require("../helpers/query");
const logger = require("../config/logger");

exports.listUsers = async (query) => {
  const { page, limit } = pageParams(query);
  const filter = {};

  if (query.role && Object.values(ROLES).includes(query.role)) {
    filter.role = query.role;
  }
  if (query.status && Object.values(USER_STATUS).includes(query.status)) {
    filter.status = query.status;
  }

  const searchTerm = searchRegex(query.search);
  if (searchTerm) {
    filter.$or = [{ name: searchTerm }, { email: searchTerm }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { items: users, total, page, limit };
};

exports.getUserById = async (userId) => {
  const user = await User.findById(userId).select(
    "-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken"
  );
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

exports.createUser = async (data) => {
  const { email, password, name, phone, role } = data;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new ApiError(409, "Email already registered");

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    phone,
    password,
    role: role || "student",
    status: "active",
    approvedAt: new Date(),
  });

  logger.info("User created by admin", { userId: user._id, createdBy: data.createdBy });

  return user.toObject();
};

exports.updateUser = async (userId, data) => {
  const allowedFields = ["name", "phone", "bio", "email", "role"];
  const updateData = Object.keys(data)
    .filter((k) => allowedFields.includes(k))
    .reduce((obj, k) => ({ ...obj, [k]: data[k] }), {});

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken");

  if (!user) throw new ApiError(404, "User not found");

  logger.info("User updated", { userId, updatedBy: data.updatedBy });

  return user;
};

exports.deleteUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { status: "deleted" }, { new: true });
  if (!user) throw new ApiError(404, "User not found");

  logger.info("User deleted (soft)", { userId });

  return { success: true, message: "User deleted" };
};

exports.suspendUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { status: "suspended" }, { new: true });
  if (!user) throw new ApiError(404, "User not found");

  logger.info("User suspended", { userId });

  return { success: true, message: "User suspended" };
};

exports.activateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { status: "active", approvedAt: new Date() },
    { new: true }
  );
  if (!user) throw new ApiError(404, "User not found");

  logger.info("User activated", { userId });

  return { success: true, message: "User activated" };
};

exports.importUsers = async (users, createdBy) => {
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < users.length; i++) {
    try {
      const userData = users[i];
      const existing = await User.findOne({ email: userData.email.toLowerCase() });
      if (existing) {
        results.failed++;
        results.errors.push({ row: i + 1, error: "Email already exists" });
        continue;
      }

      await User.create({
        ...userData,
        email: userData.email.toLowerCase(),
        status: "active",
        approvedAt: new Date(),
      });

      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push({ row: i + 1, error: err.message });
    }
  }

  logger.info("Users imported", { success: results.success, failed: results.failed, importedBy: createdBy });

  return results;
};
