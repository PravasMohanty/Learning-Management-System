const mongoose = require("mongoose");
const { Schema } = mongoose;

const mediaSchema = new Schema(
  {
    url: String,
    publicId: String,
    resourceType: String,
    originalName: String,
    bytes: Number,
  },
  { _id: false },
);
const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    approved: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const lessonSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["video", "quiz", "article"],
      default: "video",
    },
    title: { type: String, required: true },
    summary: String,
    order: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    video: mediaSchema,
    notes: [mediaSchema],
    resources: [mediaSchema],
    isPreview: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    comments: [commentSchema],
  },
  { timestamps: true },
);
lessonSchema.index({ module: 1, order: 1 });
module.exports = mongoose.model("Lesson", lessonSchema);
