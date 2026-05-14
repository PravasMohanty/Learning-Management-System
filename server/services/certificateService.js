const PDFDocument = require("pdfkit");
const Certificate = require("../models/Certificate");
const Enrollment = require("../models/Enrollment");
const crypto = require("crypto");
exports.issue = async ({ student, course, metadata = {} }) => {
  const existing = await Certificate.findOne({ student, course });
  if (existing) return existing;
  await Enrollment.findOneAndUpdate(
    { student, course },
    { status: "completed", completedAt: new Date() },
  );
  return Certificate.create({
    student,
    course,
    verificationId: crypto.randomBytes(8).toString("hex").toUpperCase(),
    metadata,
  });
};
exports.streamPdf = async (certificateId, res) => {
  const cert = await Certificate.findById(certificateId)
    .populate("student", "name")
    .populate("course", "title");
  const doc = new PDFDocument({ size: "A4", margin: 72 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=certificate-" + cert.verificationId + ".pdf",
  );
  doc.pipe(res);
  doc.fontSize(26).text(cert.title, { align: "center" });
  doc
    .moveDown(2)
    .fontSize(16)
    .text(cert.metadata?.heading || "This is to certify that", {
      align: "center",
    });
  doc.moveDown().fontSize(24).text(cert.student.name, { align: "center" });
  doc
    .moveDown()
    .fontSize(16)
    .text("has completed " + cert.course.title, { align: "center" });
  doc
    .moveDown(2)
    .fontSize(10)
    .text("Verification ID: " + cert.verificationId, { align: "center" });
  doc.end();
};
exports.verify = (verificationId) =>
  Certificate.findOne({ verificationId })
    .populate("student", "name")
    .populate("course", "title");
