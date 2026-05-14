const mongoose = require("mongoose");
const { Schema } = mongoose;

const whatsappMessageSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true,
    },
    from: String,
    to: String,
    body: String,
    media: { url: String, publicId: String },
    providerMessageId: String,
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "read", "failed", "received"],
      default: "queued",
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    chatbotHandled: { type: Boolean, default: false },
    raw: Schema.Types.Mixed,
  },
  { timestamps: true },
);
module.exports = mongoose.model("WhatsAppMessage", whatsappMessageSchema);
