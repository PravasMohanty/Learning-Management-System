const { supabase } = require("../../config/supabase");

const sendEmail = require("../../utils/mailSender");

const {
  passwordResetTemplate,
} = require("../../utils/mailTemplates");

const { generateOTP } = require("../../utils/otpUtils");

const {
  saveOTP,
  verifyOTP,
  deleteOTP,
} = require("../../services/otpService");


// ======================================================
// CHANGE PASSWORD
// ======================================================

const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = req.user;

    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
      }
    );

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("[CHANGE PASSWORD ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};


// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // ==========================================
    // SEND OTP FLOW
    // ==========================================

    if (!otp && !newPassword) {
      const { data: user } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("email", email)
        .single();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const generatedOTP = generateOTP();

      await saveOTP(email, generatedOTP);

      const html = passwordResetTemplate(
        user.name,
        generatedOTP
      );

      await sendEmail({
        to: email,
        subject: "Password Reset OTP",
        html,
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    }

    // ==========================================
    // VERIFY OTP + RESET PASSWORD FLOW
    // ==========================================

    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "OTP and new password are required",
      });
    }

    const isValidOTP = await verifyOTP(email, otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    const { error } =
      await supabase.auth.admin.updateUserById(
        profile.id,
        {
          password: newPassword,
        }
      );

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    await deleteOTP(email);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("[FORGOT PASSWORD ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

module.exports = {
    forgotPassword,
    changePassword,
};