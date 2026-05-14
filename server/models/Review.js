const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    comment: String,
    approved: { type: Boolean, default: true },
  },
  { timestamps: true },
);
reviewSchema.index({ course: 1, student: 1 }, { unique: true });
module.exports = mongoose.model("Review", reviewSchema);
