const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const { sendEnrollmentConfirmation } = require("../services/emailService");
const logger = require("../config/logger");

exports.enrollStudent = async (courseId, studentId, pricePaid = 0, currency = "INR") => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (!course.enrollmentOpen) throw new ApiError(400, "Enrollment is closed for this course");

  const existing = await Enrollment.findOne({ course: courseId, student: studentId });
  if (existing) throw new ApiError(409, "Already enrolled in this course");

  const enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    pricePaid,
    currency,
    status: "active",
  });

  course.stats.enrolledCount = (course.stats.enrolledCount || 0) + 1;
  if (pricePaid > 0) {
    course.stats.revenue = (course.stats.revenue || 0) + pricePaid;
  }
  await course.save();

  const student = await require("../models/User").findById(studentId);
  if (student) {
    await sendEnrollmentConfirmation(student, course.title);
  }

  logger.info("Student enrolled", { enrollmentId: enrollment._id, studentId, courseId });

  return enrollment;
};

exports.getStudentEnrollments = async (studentId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    Enrollment.find({ student: studentId })
      .populate("course", "title slug thumbnail stats")
      .sort("-enrolledAt")
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments({ student: studentId }),
  ]);

  return { items: enrollments, total, page, limit };
};

exports.getCourseEnrollments = async (courseId, query = {}) => {
  const page = Math.max(parseInt(query.page || "1"), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
  const skip = (page - 1) * limit;

  const filter = { course: courseId };
  if (query.status) filter.status = query.status;

  const [enrollments, total] = await Promise.all([
    Enrollment.find(filter)
      .populate("student", "name email avatar")
      .sort("-enrolledAt")
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments(filter),
  ]);

  return { items: enrollments, total, page, limit };
};

exports.getEnrollmentDetail = async (enrollmentId) => {
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate("student", "name email avatar bio")
    .populate("course", "title slug description thumbnail");

  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  return enrollment;
};

exports.completeEnrollment = async (enrollmentId) => {
  const enrollment = await Enrollment.findByIdAndUpdate(
    enrollmentId,
    { status: "completed", completedAt: new Date() },
    { new: true }
  );

  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  logger.info("Enrollment completed", { enrollmentId });

  return enrollment;
};

exports.cancelEnrollment = async (enrollmentId) => {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  if (enrollment.status === "completed") {
    throw new ApiError(400, "Cannot cancel completed enrollment");
  }

  enrollment.status = "cancelled";
  await enrollment.save();

  const course = await Course.findById(enrollment.course);
  if (course && course.stats) {
    course.stats.enrolledCount = Math.max(0, course.stats.enrolledCount - 1);
    if (enrollment.pricePaid > 0) {
      course.stats.revenue = Math.max(0, course.stats.revenue - enrollment.pricePaid);
    }
    await course.save();
  }

  logger.info("Enrollment cancelled", { enrollmentId });

  return enrollment;
};
