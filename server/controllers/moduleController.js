const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

exports.createModule = async (courseId, data, instructorId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot modify this course");
  }

  const module = await Module.create({
    course: courseId,
    title: data.title,
    summary: data.summary,
    order: data.order || (await Module.countDocuments({ course: courseId })) + 1,
  });

  logger.info("Module created", { moduleId: module._id, courseId, createdBy: instructorId });

  return module;
};

exports.listModules = async (courseId) => {
  const modules = await Module.find({ course: courseId }).sort("order");
  return modules;
};

exports.getModuleDetail = async (moduleId) => {
  const module = await Module.findById(moduleId);
  if (!module) throw new ApiError(404, "Module not found");

  const lessons = await Lesson.find({ module: moduleId, isPublished: true }).sort("order");
  return { ...module.toObject(), lessons };
};

exports.updateModule = async (moduleId, data, instructorId) => {
  const module = await Module.findById(moduleId);
  if (!module) throw new ApiError(404, "Module not found");

  const course = await Course.findById(module.course);
  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot modify this module");
  }

  const updated = await Module.findByIdAndUpdate(
    moduleId,
    { title: data.title, summary: data.summary, order: data.order },
    { new: true }
  );

  logger.info("Module updated", { moduleId, updatedBy: instructorId });

  return updated;
};

exports.deleteModule = async (moduleId, instructorId) => {
  const module = await Module.findById(moduleId);
  if (!module) throw new ApiError(404, "Module not found");

  const course = await Course.findById(module.course);
  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot delete this module");
  }

  await Lesson.deleteMany({ module: moduleId });
  await Module.findByIdAndDelete(moduleId);

  logger.info("Module deleted", { moduleId, deletedBy: instructorId });

  return { success: true, message: "Module deleted" };
};

exports.reorderModules = async (courseId, orders, instructorId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot modify this course");
  }

  for (const { moduleId, order } of orders) {
    await Module.findByIdAndUpdate(moduleId, { order });
  }

  logger.info("Modules reordered", { courseId });

  return { success: true, message: "Modules reordered" };
};
