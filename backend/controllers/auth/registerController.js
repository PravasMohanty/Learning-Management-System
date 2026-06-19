const { supabase, supabaseAdmin } = require("../../config/supabase");
const generateUserCode = require("../../utils/generateUserCode");

// ======================================================
// REGISTER ADMIN
// ======================================================

const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;

    if (!name || !email || !password || !adminCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin code",
      });
    }

    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message,
      });
    }

    const user = authData.user;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: user.id,
          user_code: generateUserCode(),
          name,
          email,
          role: "admin",
        },
      ]);

    if (profileError) {
      console.error("[PROFILE INSERT ERROR]", profileError);
      return res.status(500).json({
        success: false,
        message: "Profile creation failed",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });

  } catch (error) {
    console.error("[REGISTER ADMIN ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Admin registration failed",
    });
  }
};

// ======================================================
// SUBMIT STUDENT REGISTRATION REQUEST
// ======================================================

const submitStudentRegistrationRequest = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const { data: existingRequest } = await supabaseAdmin
      .from("registration_requests")
      .select("id")
      .eq("email", email)
      .single();

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Registration request already exists",
      });
    }

    const { error } = await supabaseAdmin
      .from("registration_requests")
      .insert([
        {
          name,
          email,
          status: "pending",
        },
      ]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registration request submitted successfully",
    });
  } catch (error) {
    console.error("[STUDENT REQUEST ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit registration request",
    });
  }
};

module.exports = {
  registerAdmin,
  submitStudentRegistrationRequest,
};