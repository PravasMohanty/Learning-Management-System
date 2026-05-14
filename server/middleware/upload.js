const multer = require("multer");
const ApiError = require("../utils/ApiError");
const storage = multer.memoryStorage();
const allowed = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/zip",
];
module.exports = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 200) * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new ApiError(415, "Unsupported file type")),
});
