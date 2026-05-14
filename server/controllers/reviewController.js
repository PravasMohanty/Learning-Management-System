const Review = require("../models/Review");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

exports.createReview = async (courseId, studentId, data) => {
  const enrollment = await Enrollment.findOne({ course: courseId, student: studentId });
  if (!enrollment) throw new ApiError(403, "Must be enrolled to review");

  const existing = await Review.findOne({ course: courseId, student: studentId });
  if (existing) throw new ApiError(409, "You already reviewed this course");

  const review = await Review.create({
    course: courseId,
    student: studentId,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
    approved: false,
  });

  await updateCourseRating(courseId);

  logger.info("Review created", { reviewId: review._id, courseId, studentId });

  return review;
};

exports.getCourseReviews = async (courseId, approved = true) => {
  const reviews = await Review.find({ course: courseId, approved })
    .populate("student", "name avatar")
    .sort("-createdAt");
  return reviews;
};

exports.getPendingReviews = async () => {
  const reviews = await Review.find({ approved: false })
    .populate("course", "title")
    .populate("student", "name email")
    .sort("createdAt");
  return reviews;
};

exports.approveReview = async (reviewId) => {
  const review = await Review.findByIdAndUpdate(reviewId, { approved: true }, { new: true });
  if (!review) throw new ApiError(404, "Review not found");

  await updateCourseRating(review.course);

  logger.info("Review approved", { reviewId });

  return review;
};

exports.deleteReview = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");

  if (String(review.student) !== String(userId)) {
    throw new ApiError(403, "Cannot delete this review");
  }

  await Review.findByIdAndDelete(reviewId);
  await updateCourseRating(review.course);

  logger.info("Review deleted", { reviewId });

  return { success: true, message: "Review deleted" };
};

const updateCourseRating = async (courseId) => {
  const reviews = await Review.find({ course: courseId, approved: true });
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  await Course.findByIdAndUpdate(courseId, {
    "stats.ratingAvg": avgRating,
    "stats.ratingCount": reviews.length,
  });
};
