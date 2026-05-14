const Lesson = require("../models/Lesson");
const Module = require("../models/Module");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

exports.createLesson = async (courseId, moduleId, data, instructorId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot modify this course");
  }

  const module = await Module.findOne({ _id: moduleId, course: courseId });
  if (!module) throw new ApiError(404, "Module not found");

  const lesson = await Lesson.create({
    course: courseId,
    module: moduleId,
    title: data.title,
    type: data.type || "video",
    summary: data.summary,
    content: data.content,
    video: data.video,
    resources: data.resources,
    order: data.order || (await Lesson.countDocuments({ module: moduleId })) + 1,
    durationSeconds: data.durationSeconds,
    isPreview: data.isPreview || false,
    isPublished: false,
  });

  logger.info("Lesson created", { lessonId: lesson._id, courseId, moduleId, createdBy: instructorId });

  return lesson;
};

exports.getLessonDetail = async (lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found");
  return lesson;
};

exports.updateLesson = async (lessonId, data, instructorId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found");

  const course = await Course.findById(lesson.course);
  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot modify this lesson");
  }

  const updateData = {
    title: data.title || lesson.title,
    summary: data.summary,
    content: data.content,
    video: data.video,
    resources: data.resources,
    durationSeconds: data.durationSeconds,
    order: data.order,
  };

  const updated = await Lesson.findByIdAndUpdate(lessonId, updateData, { new: true });

  logger.info("Lesson updated", { lessonId, updatedBy: instructorId });

  return updated;
};

exports.publishLesson = async (lessonId, instructorId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found");

  const course = await Course.findById(lesson.course);
  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot publish this lesson");
  }

  lesson.isPublished = true;
  await lesson.save();

  logger.info("Lesson published", { lessonId });

  return lesson;
};

exports.deleteLesson = async (lessonId, instructorId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found");

  const course = await Course.findById(lesson.course);
  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot delete this lesson");
  }

  await Lesson.findByIdAndDelete(lessonId);

  logger.info("Lesson deleted", { lessonId, deletedBy: instructorId });

  return { success: true, message: "Lesson deleted" };
};
