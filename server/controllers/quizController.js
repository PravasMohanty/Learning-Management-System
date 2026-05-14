const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const Course = require("../models/Course");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

exports.createQuiz = async (courseId, data, instructorId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot modify this course");
  }

  const quiz = await Quiz.create({
    course: courseId,
    module: data.module,
    lesson: data.lesson,
    title: data.title,
    subtitle: data.subtitle,
    timeLimitMinutes: data.timeLimitMinutes,
    passScore: data.passScore || 60,
    attemptsAllowed: data.attemptsAllowed || 3,
    questions: data.questions || [],
  });

  logger.info("Quiz created", { quizId: quiz._id, courseId, createdBy: instructorId });

  return quiz;
};

exports.getQuiz = async (quizId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");
  return quiz;
};

exports.updateQuiz = async (quizId, data, instructorId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");

  const course = await Course.findById(quiz.course);
  if (String(course.instructor) !== String(instructorId)) {
    throw new ApiError(403, "Cannot modify this quiz");
  }

  const updateData = {
    title: data.title || quiz.title,
    subtitle: data.subtitle,
    timeLimitMinutes: data.timeLimitMinutes,
    passScore: data.passScore,
    attemptsAllowed: data.attemptsAllowed,
    questions: data.questions,
  };

  const updated = await Quiz.findByIdAndUpdate(quizId, updateData, { new: true });

  logger.info("Quiz updated", { quizId, updatedBy: instructorId });

  return updated;
};

exports.attemptQuiz = async (quizId, studentId, answers) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found");

  const attempts = await QuizAttempt.countDocuments({ quiz: quizId, student: studentId });
  if (attempts >= quiz.attemptsAllowed) {
    throw new ApiError(400, "Maximum attempts exceeded");
  }

  const score = calculateScore(quiz.questions, answers);
  const passed = score >= quiz.passScore;

  const attempt = await QuizAttempt.create({
    quiz: quizId,
    student: studentId,
    answers,
    score,
    passed,
    attemptNumber: attempts + 1,
  });

  logger.info("Quiz attempt", { attemptId: attempt._id, quizId, studentId, score, passed });

  return attempt;
};

exports.getQuizAttempts = async (quizId, studentId) => {
  const attempts = await QuizAttempt.find({ quiz: quizId, student: studentId }).sort("-createdAt");
  return attempts;
};

exports.getQuizStats = async (quizId) => {
  const attempts = await QuizAttempt.find({ quiz: quizId });
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((a) => a.passed).length;
  const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) : 0;

  return {
    totalAttempts,
    passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
    avgScore,
  };
};

const calculateScore = (questions, answers) => {
  if (!questions.length) return 0;

  const correctAnswers = questions.filter((q) => {
    const answer = answers.find((a) => a.questionId === q._id);
    return answer && answer.value === q.correctAnswer;
  }).length;

  return Math.round((correctAnswers / questions.length) * 100);
};
