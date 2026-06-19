const { supabase, supabaseAdmin } = require("../../config/supabase");
const generateUserCode = require("../../utils/generateUserCode");

const sendEmail = require("../../utils/mailSender");

const {
  approvalEmailTemplate,
  rejectionEmailTemplate,
  approvalFailedTemplate,
} = require("../../utils/mailTemplates");

// ======================================================
// APPROVE STUDENT REGISTRATION REQUEST
// ======================================================

const approveStudentRequest = async (req, res) => {
  let request = null;

  try {
    const requestId = req.params.id;

    // ==================================================
    // FETCH REQUEST
    // ==================================================

    const { data, error: fetchError } = await supabaseAdmin
      .from("registration_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    request = data;

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: "Registration request not found",
      });
    }

    // ==================================================
    // CHECK STATUS
    // ==================================================

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    // ==================================================
    // CHECK EXISTING PROFILE
    // ==================================================

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", request.email)
      .single();

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // ==================================================
    // CREATE AUTH USER
    // ==================================================

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: request.email,

        // TEMPORARY
        password: "temporaryPassword123",

        email_confirm: true,
      });

    if (authError) {
      return res.status(500).json({
        success: false,
        message: authError.message,
      });
    }

    const authUser = authData.user;

    // ==================================================
    // CREATE PROFILE
    // ==================================================

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authUser.id,
          user_code: generateUserCode(),
          name: request.name,
          email: request.email,
          role: "student",
          status: "active",
        },
      ]);

    if (profileError) {
      return res.status(500).json({
        success: false,
        message: "Profile creation failed",
      });
    }

    // ==================================================
    // UPDATE REQUEST STATUS
    // ==================================================

    const { error: updateError } = await supabaseAdmin
      .from("registration_requests")
      .update({
        status: "accepted",
      })
      .eq("id", requestId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Failed to update request status",
      });
    }

    // ==================================================
    // SEND APPROVAL EMAIL
    // ==================================================

    const mail = approvalEmailTemplate(request.name);

    await sendEmail({
      to: request.email,

      subject: mail.subject,

      html: mail.html,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Student approved successfully",

      data: {
        id: authUser.id,
        email: authUser.email,
      },
    });
  } catch (error) {
    console.error("[APPROVE STUDENT ERROR]", error);

    // ==================================================
    // FAILURE EMAIL
    // ==================================================

    if (request?.email) {
      const mail = approvalFailedTemplate(request.name);

      await sendEmail({
        to: request.email,

        subject: mail.subject,

        html: mail.html,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to approve student",
    });
  }
};

// ======================================================
// REJECT STUDENT REGISTRATION REQUEST
// ======================================================

const rejectStudentRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const { rejectionReason } = req.body;

    // ==================================================
    // FETCH REQUEST
    // ==================================================

    const { data: request, error: fetchError } = await supabaseAdmin
      .from("registration_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: "Registration request not found",
      });
    }

    // ==================================================
    // CHECK STATUS
    // ==================================================

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status}`,
      });
    }

    // ==================================================
    // UPDATE STATUS
    // ==================================================

    const { error: updateError } = await supabaseAdmin
      .from("registration_requests")
      .update({
        status: "rejected",

        rejection_reason: rejectionReason || null,

        approved_by: req.user.id,

        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Failed to reject request",
      });
    }

    // ==================================================
    // SEND REJECTION EMAIL
    // ==================================================

    const mail = rejectionEmailTemplate(
      request.name,
      rejectionReason
    );

    await sendEmail({
      to: request.email,

      subject: mail.subject,

      html: mail.html,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Student registration request rejected",
    });
  } catch (error) {
    console.error("[REJECT STUDENT REQUEST ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject request",
    });
  }
};

module.exports = {
  approveStudentRequest,
  rejectStudentRequest,
};