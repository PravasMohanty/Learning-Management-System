const mongoose = require("mongoose");
const { Schema } = mongoose;

const progressSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    completedLessons: [
      {
        lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    lastLesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    percentage: { type: Number, default: 0 },
    watchSeconds: { type: Number, default: 0 },
    notes: String,
  },
  { timestamps: true },
);
progressSchema.index({ student: 1, course: 1 }, { unique: true });
module.exports = mongoose.model("Progress", progressSchema);
