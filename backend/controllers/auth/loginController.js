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

// ======================================================
// REFRESH ACCESS TOKEN
// ======================================================

const refreshAccessToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Use Supabase to refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const session = data.session;

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    });
  } catch (error) {
    console.error("[REFRESH TOKEN ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
};

module.exports = {
  loginUser,
  logoutUser,
  refreshAccessToken,
};