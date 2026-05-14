const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    language: { type: String, default: "English", index: true },
    type: {
      type: String,
      enum: ["recorded", "live", "hybrid"],
      default: "recorded",
    },
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    shortDescription: String,
    description: String,
    category: { type: String, index: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    thumbnail: { url: String, publicId: String },
    preview: { url: String, publicId: String, duration: Number },
    pricing: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      discountPrice: Number,
    },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: Date,
    enrollmentOpen: { type: Boolean, default: true },
    chatbot: {
      enabled: { type: Boolean, default: false },
      filters: [String],
      faq: [{ question: String, answer: String }],
    },
    stats: {
      ratingAvg: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
      enrolledCount: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
    },
    outcomes: [String],
    requirements: [String],
    targetAudience: [String],
  },
  { timestamps: true },
);
courseSchema.index({ title: "text", description: "text", category: "text" });
module.exports = mongoose.model("Course", courseSchema);
