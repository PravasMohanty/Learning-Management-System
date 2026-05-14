const mongoose = require("mongoose");
const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ["mcq", "true_false"], default: "mcq" },
    options: [{ text: String, isCorrect: Boolean }],
    points: { type: Number, default: 1 },
    explanation: String,
  },
  { _id: true },
);
const quizSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    module: { type: Schema.Types.ObjectId, ref: "Module", index: true },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson", index: true },
    title: { type: String, required: true },
    subtitle: String,
    timeLimitMinutes: { type: Number, default: 30 },
    passScore: { type: Number, default: 70 },
    attemptsAllowed: { type: Number, default: 0 },
    questions: [questionSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Quiz", quizSchema);
