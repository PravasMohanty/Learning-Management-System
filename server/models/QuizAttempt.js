const mongoose = require("mongoose");
const { Schema } = mongoose;

const answerSchema = new Schema(
  {
    question: { type: Schema.Types.ObjectId },
    selectedOption: Number,
    isCorrect: Boolean,
    pointsAwarded: { type: Number, default: 0 },
  },
  { _id: false },
);
const attemptSchema = new Schema(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
  },
  { timestamps: true },
);
module.exports = mongoose.model("QuizAttempt", attemptSchema);
