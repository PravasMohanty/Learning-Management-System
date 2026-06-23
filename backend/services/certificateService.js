const QRCode = require("qrcode");

const generatePdf = require("./pdfGenerator");
const { supabaseAdmin: supabase } =
  require("../config/supabase");

/**
 * Generate a certificate PDF, upload to Supabase storage,
 * and return the public URL.
 *
 * This function is a pure PDF-generation + upload service.
 * It does NOT check progress or insert into the certificates table —
 * that is the controller's responsibility.
 *
 * @param {Object}  data
 * @param {string}  data.certificateId
 * @param {string}  data.studentName
 * @param {string}  data.courseName
 * @param {string}  data.issueDate
 * @returns {Promise<string>} - Public URL of the uploaded PDF
 */
async function generateCertificatePdf(data) {

  // ==========================================
  // QR CODE
  // ==========================================

  const verificationUrl =
    `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify/${data.certificateId}`;

  const qrCode =
    await QRCode.toDataURL(verificationUrl);

  // ==========================================
  // GENERATE PDF
  // ==========================================

  const pdfBuffer =
    await generatePdf({
      studentName: data.studentName,
      courseName: data.courseName,
      issueDate: data.issueDate,
      certificateId: data.certificateId,
      qrCode,
    });

  // ==========================================
  // UPLOAD TO SUPABASE STORAGE
  // ==========================================

  const fileName =
    `certificates/${data.certificateId}.pdf`;

  const { error: uploadError } =
    await supabase.storage
      .from("certificates")
      .upload(
        fileName,
        pdfBuffer,
        {
          contentType:
            "application/pdf",
          upsert: true
        }
      );

  if (uploadError)
    throw uploadError;

  // ==========================================
  // GET PUBLIC URL
  // ==========================================

  const { data: urlData } =
    supabase.storage
      .from("certificates")
      .getPublicUrl(fileName);

  return urlData.publicUrl;
}

module.exports = {
  generateCertificatePdf
};