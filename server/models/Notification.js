const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "info",
        "success",
        "warning",
        "ticket",
        "course",
        "certificate",
        "whatsapp",
      ],
      default: "info",
    },
    readAt: Date,
    data: Schema.Types.Mixed,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Notification", notificationSchema);
