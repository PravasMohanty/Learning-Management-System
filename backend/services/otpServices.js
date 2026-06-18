const { supabaseAdmin: supabase } = require("../config/supabase");

// ======================================================
// SAVE OTP
// ======================================================

const saveOTP = async (email, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { error } = await supabase
    .from("password_reset_otps")
    .upsert({
      email,
      otp,
      expires_at: expiresAt,
    });

  if (error) {
    throw error;
  }
};

// ======================================================
// VERIFY OTP
// ======================================================

const verifyOTP = async (email, otp) => {
  const { data, error } = await supabase
    .from("password_reset_otps")
    .select("*")
    .eq("email", email)
    .eq("otp", otp)
    .single();

  if (error || !data) {
    return false;
  }

  const now = new Date();

  if (new Date(data.expires_at) < now) {
    return false;
  }

  return true;
};

// ======================================================
// DELETE OTP
// ======================================================

const deleteOTP = async (email) => {
  const { error } = await supabase
    .from("password_reset_otps")
    .delete()
    .eq("email", email);

  if (error) {
    throw error;
  }
};

module.exports = {
  saveOTP,
  verifyOTP,
  deleteOTP,
};