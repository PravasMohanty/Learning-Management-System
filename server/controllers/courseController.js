const slugify = require("slugify");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Review = require("../models/Review");
const ApiError = require("../utils/ApiError");
const { pageParams, searchRegex } = require("../helpers/query");
const logger = require("../config/logger");

exports.createCourse = async (data, instructorId) => {
  const slug = data.slug || slugify(data.title, { lower: true, strict: true });

  const existingSlug = await Course.findOne({ slug });
  if (existingSlug) throw new ApiError(409, "Course slug already exists");

  const course = await Course.create({
    ...data,
    slug,
    instructor: instructorId,
  });

  logger.info("Course created", { courseId: course._id, instructor: instructorId });

  return course;
};

exports.listCourses = async (query) => {
  const { page, limit } = pageParams(query);
  const filter = {};

  if (query.published === "true") filter.isPublished = true;
  if (query.published === "false") filter.isPublished = false;
  if (query.category) filter.category = query.category;
  if (query.language) filter.language = query.language;
  if (query.type) filter.type = query.type;
  if (query.level) filter.level = query.level;
  if (query.instructor) filter.instructor = query.instructor;

  const searchTerm = searchRegex(query.search);
  if (searchTerm) {
    filter.$or = [{ title: searchTerm }, { description: searchTerm }, { category: searchTerm }];
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "name email avatar")
      .sort(query.sort || "-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  return { items: courses, total, page, limit };
};

exports.getCourseDetail = async (idOrSlug) => {
  const ors = [{ slug: idOrSlug }];
  if (/^[a-f0-9]{24}$/i.test(idOrSlug)) ors.push({ _id: idOrSlug });

  const course = await Course.findOne({ $or: ors }).populate("instructor", "name email bio avatar");
  if (!course) throw new ApiError(404, "Course not found");

  const [modules, lessons, reviews, enrollmentCount] = await Promise.all([
    Module.find({ course: course._id }).sort("order"),
    Lesson.find({ course: course._id, isPublished: true }).sort("order"),
    Review.find({ course: course._id, approved: true })
      .populate("student", "name avatar")
      .sort("-createdAt")
      .limit(20),
    Enrollment.countDocuments({ course: course._id, status: "active" }),
  ]);

  const curriculum = modules.map((m) => ({
    ...m.toObject(),
    lessons: lessons.filter((l) => String(l.module) === String(m._id)),
  }));

  return {
    course,
    curriculum,
    reviews,
    enrollmentCount,
  };
};

exports.updateCourse = async (courseId, data, userId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(userId) && data.role !== "admin") {
    throw new ApiError(403, "Cannot modify this course");
  }

  const updateData = {
    title: data.title || course.title,
    description: data.description || course.description,
    shortDescription: data.shortDescription || course.shortDescription,
    category: data.category || course.category,
    level: data.level || course.level,
    language: data.language || course.language,
    type: data.type || course.type,
    pricing: data.pricing || course.pricing,
    outcomes: data.outcomes || course.outcomes,
    requirements: data.requirements || course.requirements,
    targetAudience: data.targetAudience || course.targetAudience,
    thumbnail: data.thumbnail || course.thumbnail,
    preview: data.preview || course.preview,
  };

  const updated = await Course.findByIdAndUpdate(courseId, updateData, {
    new: true,
    runValidators: true,
  }).populate("instructor", "name email avatar");

  logger.info("Course updated", { courseId, updatedBy: userId });

  return updated;
};

exports.publishCourse = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(userId)) {
    throw new ApiError(403, "Cannot publish this course");
  }

  const modules = await Module.find({ course: courseId });
  if (modules.length === 0) throw new ApiError(400, "Course must have at least one module");

  const course_updated = await Course.findByIdAndUpdate(
    courseId,
    { isPublished: true, publishedAt: new Date(), enrollmentOpen: true },
    { new: true }
  );

  logger.info("Course published", { courseId, publishedBy: userId });

  return course_updated;
};

exports.deleteCourse = async (courseId, userId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(userId)) {
    throw new ApiError(403, "Cannot delete this course");
  }

  await Enrollment.deleteMany({ course: courseId });
  await Module.deleteMany({ course: courseId });
  await Lesson.deleteMany({ course: courseId });
  await Course.findByIdAndDelete(courseId);

  logger.info("Course deleted", { courseId, deletedBy: userId });

  return { success: true, message: "Course deleted" };
};

exports.toggleEnrollmentOpen = async (courseId, open, userId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(userId)) {
    throw new ApiError(403, "Cannot modify this course");
  }

  course.enrollmentOpen = open;
  await course.save();

  logger.info("Enrollment toggled", { courseId, enrollmentOpen: open });

  return course;
};
