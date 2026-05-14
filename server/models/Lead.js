const mongoose = require("mongoose");
const { Schema } = mongoose;

const leadSchema = new Schema(
  {
    name: String,
    phone: { type: String, required: true, index: true },
    email: String,
    tags: [String],
    source: { type: String, default: "manual" },
    status: {
      type: String,
      enum: ["new", "subscribed", "unsubscribed", "bounced"],
      default: "new",
    },
    customFields: Schema.Types.Mixed,
    importedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
leadSchema.index({ phone: 1 }, { unique: true });
module.exports = mongoose.model("Lead", leadSchema);
