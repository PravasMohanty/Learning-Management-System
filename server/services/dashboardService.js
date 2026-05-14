const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Ticket = require("../models/Ticket");
const Campaign = require("../models/Campaign");
const WhatsAppMessage = require("../models/WhatsAppMessage");
exports.adminDashboard = async () => {
  const [
    activeStudents,
    activeInstructors,
    totalCourses,
    enrollments,
    ticketStats,
    waMessages,
    campaigns,
    pendingUsers,
    recentTickets,
  ] = await Promise.all([
    User.countDocuments({ role: "student", status: "active" }),
    User.countDocuments({ role: "instructor", status: "active" }),
    Course.countDocuments(),
    Enrollment.find(),
    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    WhatsAppMessage.countDocuments(),
    Campaign.countDocuments(),
    User.find({ status: "pending" }).limit(10),
    Ticket.find().populate("user", "name").sort("-createdAt").limit(5),
  ]);
  return {
    totals: {
      activeStudents,
      activeInstructors,
      totalCourses,
      totalEnrollments: enrollments.length,
      revenue: enrollments.reduce((s, e) => s + (e.pricePaid || 0), 0),
    },
    ticketStats,
    whatsapp: { messages: waMessages, campaigns },
    pendingUsers,
    recentTickets,
  };
};
exports.courseAnalytics = () =>
  Course.find()
    .select("title stats pricing isPublished")
    .sort("-stats.enrolledCount")
    .limit(20);
