const mongoose = require("mongoose");
const { Schema } = mongoose;

const campaignSchema = new Schema(
  {
    name: { type: String, required: true },
    messageTemplate: { type: String, required: true },
    media: { url: String, publicId: String },
    targetTags: [String],
    leads: [{ type: Schema.Types.ObjectId, ref: "Lead" }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "running", "completed", "failed"],
      default: "draft",
      index: true,
    },
    scheduledAt: Date,
    sentAt: Date,
    stats: {
      queued: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      replies: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Campaign", campaignSchema);
