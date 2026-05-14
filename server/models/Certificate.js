const mongoose = require("mongoose");
const { Schema } = mongoose;

const certificateSchema = new Schema(
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
    verificationId: { type: String, unique: true, required: true },
    title: { type: String, default: "Certificate of Completion" },
    issuedAt: { type: Date, default: Date.now },
    pdf: { url: String, publicId: String },
    metadata: { heading: String, footer: String },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Certificate", certificateSchema);
