const { parse } = require("csv-parse/sync");
const User = require("../models/User");
const { pageParams, searchRegex } = require("../helpers/query");
exports.listUsers = async (query) => {
  const { page, limit } = pageParams(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  const s = searchRegex(query.search);
  if (s) filter.$or = [{ name: s }, { email: s }, { phone: s }];
  const [items, total] = await Promise.all([
    User.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};
exports.createUser = (data) => User.create(data);
exports.updateUser = (id, data) =>
  User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
exports.deleteUser = (id) =>
  User.findByIdAndUpdate(id, { status: "deleted" }, { new: true });
exports.suspendUser = (id) =>
  User.findByIdAndUpdate(
    id,
    { status: "suspended", $inc: { tokenVersion: 1 } },
    { new: true },
  );
exports.importUsers = async (buffer) => {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const report = { total: rows.length, created: 0, skipped: 0, errors: [] };
  for (const [i, row] of rows.entries()) {
    try {
      if (!row.email || !row.password || !row.name) {
        report.skipped++;
        report.errors.push({
          row: i + 2,
          error: "name,email,password required",
        });
        continue;
      }
      if (await User.findOne({ email: row.email.toLowerCase() })) {
        report.skipped++;
        continue;
      }
      await User.create({
        name: row.name,
        email: row.email,
        phone: row.phone,
        password: row.password,
        role: row.role || "student",
      });
      report.created++;
    } catch (err) {
      report.skipped++;
      report.errors.push({ row: i + 2, error: err.message });
    }
  }
  return report;
};
exports.csvTemplate =
  "name,email,phone,password,role\nDemo Student,demo@example.com,9999999999,Password@123,student\n";
