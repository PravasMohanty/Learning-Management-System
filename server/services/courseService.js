const slugify = require("slugify");
const Course = require("../models/Course");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Review = require("../models/Review");
const ApiError = require("../utils/ApiError");
const { pageParams, searchRegex } = require("../helpers/query");
exports.createCourse = async (data) =>
  Course.create({
    ...data,
    slug: data.slug || slugify(data.title, { lower: true, strict: true }),
  });
exports.listCourses = async (query) => {
  const { page, limit } = pageParams(query);
  const filter = {};
  if (query.published) filter.isPublished = query.published === "true";
  if (query.category) filter.category = query.category;
  if (query.language) filter.language = query.language;
  if (query.type) filter.type = query.type;
  const s = searchRegex(query.search);
  if (s) filter.$or = [{ title: s }, { description: s }, { category: s }];
  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate("instructor", "name email avatar")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Course.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};
exports.getCourseDetail = async (idOrSlug) => {
  const ors = [{ slug: idOrSlug }];
  if (/^[a-fd]{24}$/i.test(idOrSlug)) ors.push({ _id: idOrSlug });
  const course = await Course.findOne({ $or: ors }).populate(
    "instructor",
    "name email bio avatar",
  );
  if (!course) throw new ApiError(404, "Course not found");
  const [modules, reviews] = await Promise.all([
    Module.find({ course: course._id }).sort("order"),
    Review.find({ course: course._id, approved: true })
      .populate("student", "name avatar")
      .sort("-createdAt")
      .limit(20),
  ]);
  const lessons = await Lesson.find({
    course: course._id,
    isPublished: true,
  }).sort("order");
  return {
    course,
    curriculum: modules.map((m) => ({
      ...m.toObject(),
      lessons: lessons.filter((l) => String(l.module) === String(m._id)),
    })),
    reviews,
  };
};
exports.updateCourse = (id, data) =>
  Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
exports.deleteCourse = (id) => Course.findByIdAndDelete(id);
exports.publishCourse = (id, isPublished) =>
  Course.findByIdAndUpdate(
    id,
    { isPublished, publishedAt: isPublished ? new Date() : null },
    { new: true },
  );
exports.createModule = (data) => Module.create(data);
exports.updateModule = (id, data) =>
  Module.findByIdAndUpdate(id, data, { new: true, runValidators: true });
exports.deleteModule = (id) => Module.findByIdAndDelete(id);
exports.createLesson = (data) => Lesson.create(data);
exports.updateLesson = (id, data) =>
  Lesson.findByIdAndUpdate(id, data, { new: true, runValidators: true });
exports.deleteLesson = (id) => Lesson.findByIdAndDelete(id);
exports.enroll = async (student, course) => {
  const existed = await Enrollment.findOne({ student, course });
  const doc = existed || (await Enrollment.create({ student, course }));
  if (!existed)
    await Course.findByIdAndUpdate(course, {
      $inc: { "stats.enrolledCount": 1 },
    });
  return doc;
};
exports.addComment = async (lesson, user, text) =>
  Lesson.findByIdAndUpdate(
    lesson,
    { $push: { comments: { user, text } } },
    { new: true },
  );
