const mongoose = require("mongoose");
const { Schema } = mongoose;

const bcrypt = require("bcryptjs");
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "instructor", "student", "support_agent"],
      default: "student",
      index: true,
    },
    avatar: { url: String, publicId: String },
    bio: String,
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "deleted"],
      default: "active",
      index: true,
    },
    approvedAt: Date,
    lastLoginAt: Date,
    tokenVersion: { type: Number, default: 0 },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      whatsappOptIn: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};
userSchema.index({ name: "text", email: "text", phone: "text" });
module.exports = mongoose.model("User", userSchema);
