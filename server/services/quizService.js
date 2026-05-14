const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const progressService = require("./progressService");
exports.createQuiz = (data) => Quiz.create(data);
exports.updateQuiz = (id, data) =>
  Quiz.findByIdAndUpdate(id, data, { new: true, runValidators: true });
exports.getQuiz = (id) => Quiz.findById(id);
exports.listQuizzes = (query) =>
  Quiz.find(query.course ? { course: query.course } : {}).sort("-createdAt");
exports.submitAttempt = async ({ quizId, student, answers }, io) => {
  const quiz = await Quiz.findById(quizId);
  let score = 0,
    total = 0;
  const checked = quiz.questions.map((q, i) => {
    const selected = answers[i]?.selectedOption;
    const correctIndex = q.options.findIndex((o) => o.isCorrect);
    const isCorrect = selected === correctIndex;
    total += q.points || 1;
    if (isCorrect) score += q.points || 1;
    return {
      question: q._id,
      selectedOption: selected,
      isCorrect,
      pointsAwarded: isCorrect ? q.points || 1 : 0,
    };
  });
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student,
    course: quiz.course,
    answers: checked,
    score,
    percentage,
    passed: percentage >= quiz.passScore,
    submittedAt: new Date(),
  });
  if (attempt.passed && quiz.lesson)
    await progressService.markLesson(
      { student, course: quiz.course, lesson: quiz.lesson },
      io,
    );
  return attempt;
};
