const mongoose = require("mongoose");
const { Schema } = mongoose;

const enrollmentSchema = new Schema(
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
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "refunded"],
      default: "active",
    },
    pricePaid: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true },
);
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
module.exports = mongoose.model("Enrollment", enrollmentSchema);
