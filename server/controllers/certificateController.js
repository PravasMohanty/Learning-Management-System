const Certificate = require("../models/Certificate");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const PDFDocument = require("pdfkit");
const logger = require("../config/logger");

exports.issueCertificate = async (enrollmentId) => {
  const enrollment = await Enrollment.findById(enrollmentId).populate("student").populate("course");
  if (!enrollment) throw new ApiError(404, "Enrollment not found");

  if (enrollment.status !== "completed") {
    throw new ApiError(400, "Enrollment must be completed");
  }

  const existing = await Certificate.findOne({ enrollment: enrollmentId });
  if (existing) return existing;

  const cert = await Certificate.create({
    enrollment: enrollmentId,
    student: enrollment.student._id,
    course: enrollment.course._id,
    issueDate: new Date(),
    certificateNumber: generateCertificateNumber(),
  });

  logger.info("Certificate issued", { certificateId: cert._id, enrollmentId, studentId: enrollment.student._id });

  return cert;
};

exports.getCertificate = async (certificateId) => {
  const cert = await Certificate.findById(certificateId)
    .populate("student", "name")
    .populate("course", "title");
  if (!cert) throw new ApiError(404, "Certificate not found");
  return cert;
};

exports.verifyCertificate = async (certificateNumber) => {
  const cert = await Certificate.findOne({ certificateNumber }).populate("student", "name").populate("course", "title");
  if (!cert) throw new ApiError(404, "Certificate not found");
  return { valid: cert.status === "issued", certificate: cert };
};

exports.generateCertificatePDF = async (certificateId) => {
  const cert = await Certificate.findById(certificateId)
    .populate("student", "name")
    .populate("course", "title");

  if (!cert) throw new ApiError(404, "Certificate not found");

  const doc = new PDFDocument();
  doc.fontSize(20).text("Certificate of Completion", { align: "center" });
  doc.fontSize(12).text("---", { align: "center" });
  doc.text(`This is to certify that ${cert.student.name}`, { align: "center" });
  doc.text(`has successfully completed the course:`, { align: "center" });
  doc.fontSize(14).text(cert.course.title, { align: "center" });
  doc.fontSize(10).text(`Issued on: ${cert.issueDate.toDateString()}`, { align: "center" });
  doc.text(`Certificate #: ${cert.certificateNumber}`, { align: "center" });

  return doc;
};

exports.revokeCertificate = async (certificateId) => {
  const cert = await Certificate.findByIdAndUpdate(
    certificateId,
    { status: "revoked", revokedAt: new Date() },
    { new: true }
  );
  if (!cert) throw new ApiError(404, "Certificate not found");

  logger.info("Certificate revoked", { certificateId });

  return cert;
};

exports.getStudentCertificates = async (studentId) => {
  const certs = await Certificate.find({ student: studentId, status: "issued" })
    .populate("course", "title slug")
    .sort("-issueDate");
  return certs;
};

const generateCertificateNumber = () => {
  const date = new Date();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${date.getFullYear()}-${random}`;
};
