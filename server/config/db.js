const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lms_whatsapp_saas";

module.exports = async function connectDB() {
  if (!MONGO_URI) throw new ApiError(500, "MONGO_URI is not defined");
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB connected");
};
