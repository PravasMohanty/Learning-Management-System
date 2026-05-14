const mongoose = require("mongoose");
const { Schema } = mongoose;

const moduleSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    summary: String,
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);
moduleSchema.index({ course: 1, order: 1 });
module.exports = mongoose.model("Module", moduleSchema);
