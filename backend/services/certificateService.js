const PDFDocument = require("pdfkit");
const { supabaseAdmin: supabase } = require("../config/supabase");

const generateCertificatePdf = async ({ certificateId, studentName, courseName, issueDate }) => {
  try {
    const doc = new PDFDocument({ layout: "landscape", size: "A4" });

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    const pdfEnd = new Promise((resolve) => doc.on("end", resolve));

    doc.fontSize(40).text("Certificate of Completion", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(24).text("This certifies that", { align: "center" });
    doc.moveDown();
    doc.fontSize(36).text(studentName, { align: "center" });
    doc.moveDown();
    doc.fontSize(20).text(`has successfully completed the course`, { align: "center" });
    doc.moveDown();
    doc.fontSize(28).text(courseName, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).text(`Certificate ID: ${certificateId}`, { align: "center" });
    doc.fontSize(16).text(`Issue Date: ${new Date(issueDate).toLocaleDateString()}`, { align: "center" });

    doc.end();
    await pdfEnd;

    const pdfBuffer = Buffer.concat(buffers);

    const fileName = `certificates/${certificateId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("certificates")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("[CERTIFICATE PDF ERROR]", error);
    throw error;
  }
};

const generateCertificate = async (studentId, courseId) => {
  try {
    const { data: progress } = await supabase
      .from("course_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .single();

    if (!progress || progress.progress < 100) return null;

    const { data: existingCert } = await supabase
      .from("certificates")
      .select("id")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingCert) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", studentId)
      .single();

    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();

    if (!profile || !course) return null;

    const certificateId = `CERT-${Date.now()}`;

    const pdfUrl = await generateCertificatePdf({
      certificateId,
      studentName: profile.name,
      courseName: course.title,
      issueDate: new Date(),
    });

    const { error: insertError } = await supabase
      .from("certificates")
      .insert([{
        certificate_id: certificateId,
        student_id: studentId,
        course_id: courseId,
        issue_date: new Date(),
        pdf_url: pdfUrl,
        status: "active",
      }]);

    if (insertError) throw insertError;

    await supabase
      .from("course_progress")
      .update({ certificate_issued: true })
      .eq("id", progress.id);

    return pdfUrl;
  } catch (error) {
    console.error("[GENERATE CERTIFICATE ERROR]", error);
    throw error;
  }
};

module.exports = {
  generateCertificate,
  generateCertificatePdf,
};
