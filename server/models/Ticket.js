const mongoose = require("mongoose");
const { Schema } = mongoose;

const attachmentSchema = new Schema(
  { url: String, publicId: String, originalName: String },
  { _id: false },
);
const ticketSchema = new Schema(
  {
    ticketNo: { type: String, unique: true, index: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: String,
    attachments: [attachmentSchema],
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true },
);
ticketSchema.pre("validate", function (next) {
  if (!this.ticketNo)
    this.ticketNo = "#" + Math.floor(10000 + Math.random() * 89999);
  next();
});
module.exports = mongoose.model("Ticket", ticketSchema);
