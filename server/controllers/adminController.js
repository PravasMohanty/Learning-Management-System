const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Ticket = require("../models/Ticket");
const Review = require("../models/Review");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

exports.getDashboardStats = async (adminId) => {
  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    activeStudents,
    openTickets,
    pendingReviews,
    totalRevenue,
    activeInstructors,
  ] = await Promise.all([
    User.countDocuments({ status: "active" }),
    Course.countDocuments({ isPublished: true }),
    Enrollment.countDocuments({ status: "active" }),
    User.countDocuments({ role: "student", status: "active", lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    Ticket.countDocuments({ status: "open" }),
    Review.countDocuments({ approved: false }),
    Enrollment.aggregate([{ $group: { _id: null, total: { $sum: "$pricePaid" } } }]),
    User.countDocuments({ role: "instructor", status: "active" }),
  ]);

  return {
    totalUsers,
    totalCourses,
    totalEnrollments,
    activeStudents,
    openTickets,
    pendingReviews,
    totalRevenue: totalRevenue[0]?.total || 0,
    activeInstructors,
    lastUpdated: new Date(),
  };
};

exports.getUserStats = async () => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  return stats;
};

exports.getCourseStats = async () => {
  const courses = await Course.find()
    .select("stats title instructor")
    .populate("instructor", "name")
    .limit(20)
    .sort("-stats.revenue");

  return courses;
};

exports.getRevenueStats = async (days = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await Enrollment.aggregate([
    { $match: { createdAt: { $gte: startDate }, status: "active" } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        revenue: { $sum: "$pricePaid" },
        enrollments: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return stats;
};

exports.getTicketStats = async () => {
  const stats = await Ticket.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return stats;
};

exports.getSystemHealth = async () => {
  try {
    const dbConnection = await User.collection.db.admin().ping();
    return {
      database: dbConnection.ok === 1 ? "healthy" : "unhealthy",
      timestamp: new Date(),
    };
  } catch (err) {
    logger.error("Database health check failed", err);
    return { database: "unhealthy", error: err.message };
  }
};
