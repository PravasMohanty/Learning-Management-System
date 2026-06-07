const express = require("express");
const certificateRouter = express.Router();

const {
  generateCertificate,
  getMyCertificates,
  getCertificateById,
  downloadCertificate,
  getAllCertificates,
} = require("../controllers/certificates/certificateController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const { adminMiddleware } = require("../middlewares/adminMiddleware");

// ======================================================
// CERTIFICATE ROUTES
// ======================================================

// Generate certificate for a course (auth required)
certificateRouter.post("/:courseId/generate", authMiddleware, generateCertificate);

// Get my certificates (auth required)
certificateRouter.get("/my", authMiddleware, getMyCertificates);

// Get all certificates (admin only)
certificateRouter.get("/all", authMiddleware, adminMiddleware, getAllCertificates);

// Get single certificate (auth required)
certificateRouter.get("/:id", authMiddleware, getCertificateById);

// Download certificate (auth required)
certificateRouter.get("/:id/download", authMiddleware, downloadCertificate);

module.exports = certificateRouter;
