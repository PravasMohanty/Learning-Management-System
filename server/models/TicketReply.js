const mongoose = require("mongoose");
const { Schema } = mongoose;

const ticketReplySchema = new Schema(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    attachments: [{ url: String, publicId: String, originalName: String }],
    internal: { type: Boolean, default: false },
  },
  { timestamps: true },
);
module.exports = mongoose.model("TicketReply", ticketReplySchema);
