const { supabase, supabaseAdmin } = require("../../config/supabase");
const generateUserCode = require("../../utils/generateUserCode");

const sendEmail = require("../../utils/mailSender");

const {
  approvalEmailTemplate,
  rejectionEmailTemplate,
  approvalFailedTemplate,
} = require("../../utils/mailTemplates");


// ==================================================
// FETCH ALL REGISTRATION REQUESTS
// ==================================================

const viewAllRequests = async (req, res) => {
  try {

    const { data: requests, error } = await supabaseAdmin
      .from("registration_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[VIEW REQUESTS ERROR]", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch registration requests",
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      totalRequests: requests.length,
      requests,
    });
  } catch (error) {
    console.error("[VIEW REQUESTS ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch registration requests",
    });
  }
};


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
      .maybeSingle();

    let authUserId = existingProfile?.id;

    // Only create auth user + profile if one doesn't exist yet
    // (handles retries after a partially-failed approval)
    if (!authUserId) {
      // ================================================
      // CREATE AUTH USER
      // ================================================

      let authUser;

      if (supabaseAdmin.auth.admin) {
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: request.email,
            password: "temporaryPassword123",
            email_confirm: true,
          });

        if (authError) {
          if (authError.message.includes("already been registered")) {
            const { data: { users } } =
              await supabaseAdmin.auth.admin.listUsers();
            authUser = users.find(
              (u) => u.email === request.email
            );
            if (!authUser) {
              return res.status(500).json({
                success: false,
                message: "User exists but could not be found",
              });
            }
          } else {
            return res.status(500).json({
              success: false,
              message: authError.message,
            });
          }
        } else {
          authUser = authData.user;
        }
      } else {
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.signUp({
            email: request.email,
            password: "temporaryPassword123",
          });

        if (authError) {
          return res.status(500).json({
            success: false,
            message: authError.message,
          });
        }

        if (!authData.user) {
          return res.status(400).json({
            success: false,
            message:
              "This email is already registered. " +
              "Please use a different email or contact support.",
          });
        }

        authUser = authData.user;
      }

      authUserId = authUser.id;

      // ================================================
      // CREATE PROFILE
      // ================================================

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert([
          {
            id: authUserId,
            user_code: generateUserCode(),
            name: request.name,
            email: request.email,
            role: "student",
            // status: "active", // Temporarily removed to fix 500 error: column doesn't exist in Supabase DB yet
          },
        ]);

      if (profileError) {
        return res.status(500).json({
          success: false,
          message: "Profile creation failed",
        });
      }
    }

    // ==================================================
    // UPDATE REQUEST STATUS
    // ==================================================

    const { error: updateError } = await supabaseAdmin
      .from("registration_requests")
      .update({
        status: "approved",
      })
      .eq("id", requestId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Failed to update request status",
      });
    }

    // ==================================================
    // SEND APPROVAL EMAIL (non-blocking)
    // ==================================================

    try {
      const mail = approvalEmailTemplate(request.name);

      await sendEmail({
        to: request.email,
        subject: mail.subject,
        html: mail.html,
      });
    } catch (emailError) {
      console.error("[APPROVAL EMAIL ERROR]", emailError);
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Student approved successfully",

      data: {
        id: authUserId,
        email: request.email,
      },
    });
  } catch (error) {
    console.error("[APPROVE STUDENT ERROR]", error);

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

        // rejection_reason: rejectionReason || null, // Temporarily removed to fix 500 error: column doesn't exist in Supabase DB yet
      })
      .eq("id", requestId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: "Failed to reject request",
      });
    }

    // ==================================================
    // SEND REJECTION EMAIL (non-blocking)
    // ==================================================

    try {
      const mail = rejectionEmailTemplate(
        request.name,
        rejectionReason
      );

      await sendEmail({
        to: request.email,
        subject: mail.subject,
        html: mail.html,
      });
    } catch (emailError) {
      console.error("[REJECTION EMAIL ERROR]", emailError);
    }

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
  viewAllRequests
};