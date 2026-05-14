const Progress = require("../models/Progress");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Certificate = require("../models/Certificate");
exports.getStudentDashboard = async (student) => {
  const enrollments = await Enrollment.find({ student, status: "active" })
    .populate({
      path: "course",
      populate: { path: "instructor", select: "name avatar" },
    })
    .sort("-updatedAt");
  const progresses = await Progress.find({ student });
  const certificates = await Certificate.find({ student }).populate(
    "course",
    "title slug",
  );
  const completed = progresses.filter((p) => p.percentage >= 100).length;
  return {
    stats: {
      enrolledCourses: enrollments.length,
      completed,
      hoursLearned: Math.round(
        progresses.reduce((s, p) => s + (p.watchSeconds || 0), 0) / 3600,
      ),
      certificates: certificates.length,
    },
    continueLearning: enrollments.map((e) => ({
      enrollment: e,
      progress:
        progresses.find((p) => String(p.course) === String(e.course._id)) ||
        null,
    })),
    certificates,
  };
};
exports.getCourseProgress = (student, course) =>
  Progress.findOne({ student, course }).populate(
    "lastLesson completedLessons.lesson",
  );
exports.markLesson = async (
  { student, course, lesson, watchSeconds = 0 },
  io,
) => {
  const total = await Lesson.countDocuments({ course, isPublished: true });
  let progress = await Progress.findOne({ student, course });
  if (!progress) progress = new Progress({ student, course });
  progress.lastLesson = lesson;
  progress.watchSeconds += Number(watchSeconds || 0);
  if (
    !progress.completedLessons.some((x) => String(x.lesson) === String(lesson))
  )
    progress.completedLessons.push({ lesson });
  progress.percentage = total
    ? Math.round((progress.completedLessons.length / total) * 100)
    : 0;
  await progress.save();
  io?.to(String(student)).emit("progress:updated", progress);
  return progress;
};
