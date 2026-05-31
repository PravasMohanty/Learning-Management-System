const { supabase } = require("../../config/supabase");

// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return res.status(401).json({
        success: false,
        message: authError.message,
      });
    }

    const user = authData.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (profile.is_locked) {
      return res.status(403).json({
        success: false,
        message: "Account is locked",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,

        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        },
      },
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ======================================================
// LOGOUT USER
// ======================================================

const logoutUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("[LOGOUT ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

module.exports = {
  loginUser,
  logoutUser,
};