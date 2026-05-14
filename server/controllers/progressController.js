const Progress = require("../models/Progress");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

exports.getProgress = async (studentId, courseId) => {
  const progress = await Progress.findOne({ student: studentId, course: courseId })
    .populate("completedLessons.lesson", "title type durationSeconds")
    .populate("lastLesson", "title");

  if (!progress) throw new ApiError(404, "Progress not found");

  return progress;
};

exports.initializeProgress = async (studentId, courseId) => {
  const existing = await Progress.findOne({ student: studentId, course: courseId });
  if (existing) return existing;

  const progress = await Progress.create({
    student: studentId,
    course: courseId,
    percentage: 0,
    watchSeconds: 0,
  });

  logger.info("Progress initialized", { studentId, courseId });

  return progress;
};

exports.markLessonComplete = async (studentId, courseId, lessonId) => {
  let progress = await Progress.findOne({ student: studentId, course: courseId });

  if (!progress) {
    progress = await exports.initializeProgress(studentId, courseId);
  }

  const alreadyCompleted = progress.completedLessons.some((c) => String(c.lesson) === String(lessonId));

  if (!alreadyCompleted) {
    progress.completedLessons.push({
      lesson: lessonId,
      completedAt: new Date(),
    });
  }

  progress.lastLesson = lessonId;
  await updateProgressPercentage(progress);
  await progress.save();

  logger.info("Lesson marked complete", { studentId, courseId, lessonId });

  return progress;
};

exports.updateWatchTime = async (studentId, courseId, seconds) => {
  let progress = await Progress.findOne({ student: studentId, course: courseId });

  if (!progress) {
    progress = await exports.initializeProgress(studentId, courseId);
  }

  progress.watchSeconds = (progress.watchSeconds || 0) + seconds;
  await progress.save();

  return progress;
};

exports.addNote = async (studentId, courseId, notes) => {
  const progress = await Progress.findOneAndUpdate(
    { student: studentId, course: courseId },
    { notes },
    { new: true }
  );

  if (!progress) throw new ApiError(404, "Progress not found");

  return progress;
};

exports.getStudentProgress = async (studentId, query = {}) => {
  const page = Math.max(parseInt(query.page || "1"), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
  const skip = (page - 1) * limit;

  const [progress, total] = await Promise.all([
    Progress.find({ student: studentId })
      .populate("course", "title slug stats")
      .sort("-updatedAt")
      .skip(skip)
      .limit(limit),
    Progress.countDocuments({ student: studentId }),
  ]);

  return { items: progress, total, page, limit };
};

exports.getCourseProgress = async (courseId, query = {}) => {
  const page = Math.max(parseInt(query.page || "1"), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20"), 1), 100);
  const skip = (page - 1) * limit;

  const [progress, total] = await Promise.all([
    Progress.find({ course: courseId })
      .populate("student", "name email avatar")
      .sort("-updatedAt")
      .skip(skip)
      .limit(limit),
    Progress.countDocuments({ course: courseId }),
  ]);

  return { items: progress, total, page, limit };
};

const updateProgressPercentage = async (progress) => {
  const totalLessons = await Lesson.countDocuments({ course: progress.course, isPublished: true });

  if (totalLessons > 0) {
    progress.percentage = Math.round((progress.completedLessons.length / totalLessons) * 100);
  }
};
