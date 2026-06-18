const { supabaseAdmin: supabase } = require("../../config/supabase");
const certificateService = require("../../services/certificateService");

/**
 * Generate Certificate
 */
const generateCertificate = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    // ==========================================
    // CHECK PROGRESS
    // ==========================================

    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from("course_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .single();

    if (progressError || !progress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });
    }

    // ==========================================
    // CHECK COURSE COMPLETION
    // ==========================================

    if (progress.progress < 100) {
      return res.status(400).json({
        success: false,
        message: "Course not completed yet",
      });
    }

    // ==========================================
    // CHECK EXISTING CERTIFICATE
    // ==========================================

    const {
      data: existingCertificate,
    } = await supabase
      .from("certificates")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: "Certificate already exists",
        certificate: existingCertificate,
      });
    }

    // ==========================================
    // FETCH COURSE
    // ==========================================

    const {
      data: course,
      error: courseError,
    } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ==========================================
    // GENERATE CERTIFICATE ID
    // ==========================================

    const certificateId =
      `CERT-${Date.now()}`;

    // ==========================================
    // GENERATE PDF
    // ==========================================

    const pdfUrl =
      await certificateService.generateCertificatePdf({
        certificateId,
        studentName: req.user.name,
        studentEmail: req.user.email,
        courseName: course.title,
        issueDate: new Date(),
      });

    // ==========================================
    // INSERT CERTIFICATE
    // ==========================================

    const {
      data: certificate,
      error: certificateError,
    } = await supabase
      .from("certificates")
      .insert([
        {
          certificate_id: certificateId,
          student_id: studentId,
          course_id: courseId,
          issue_date: new Date(),
          pdf_url: pdfUrl,
          status: "active",
        },
      ])
      .select()
      .single();

    if (certificateError) {
      throw certificateError;
    }

    // ==========================================
    // UPDATE PROGRESS
    // ==========================================

    await supabase
      .from("course_progress")
      .update({
        certificate_issued: true,
      })
      .eq("id", progress.id);

    return res.status(201).json({
      success: true,
      message: "Certificate generated successfully",
      certificate,
    });

  } catch (error) {

    console.error(
      "[GENERATE CERTIFICATE ERROR]",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/**
 * Student Certificates
 */
const getMyCertificates = async (req, res) => {
  try {

    const {
      data,
      error,
    } = await supabase
      .from("certificates")
      .select(`
        *,
        courses(
          id,
          title
        )
      `)
      .eq("student_id", req.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      certificates: data,
    });

  } catch (error) {

    console.error(
      "[GET CERTIFICATES ERROR]",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/**
 * Single Certificate
 */
const getCertificateById = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      data,
      error,
    } = await supabase
      .from("certificates")
      .select(`
        *,
        courses(
          id,
          title
        )
      `)
      .eq("id", id)
      .eq("student_id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    return res.status(200).json({
      success: true,
      certificate: data,
    });

  } catch (error) {

    console.error(
      "[GET CERTIFICATE ERROR]",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/**
 * Download Certificate
 */
const downloadCertificate = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      data,
      error,
    } = await supabase
      .from("certificates")
      .select("pdf_url")
      .eq("id", id)
      .eq("student_id", req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    return res.status(200).json({
      success: true,
      downloadUrl: data.pdf_url,
    });

  } catch (error) {

    console.error(
      "[DOWNLOAD CERTIFICATE ERROR]",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/**
 * Admin - All Certificates
 */
const getAllCertificates = async (req, res) => {
  try {

    const {
      data,
      error,
    } = await supabase
      .from("certificates")
      .select(`
        *,
        courses(
          id,
          title
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      certificates: data,
    });

  } catch (error) {

    console.error(
      "[GET ALL CERTIFICATES ERROR]",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  generateCertificate,
  getMyCertificates,
  getCertificateById,
  downloadCertificate,
  getAllCertificates,
};