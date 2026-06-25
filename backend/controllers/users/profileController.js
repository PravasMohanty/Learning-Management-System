const { supabaseAdmin: supabase } = require("../../config/supabase");

// ======================================================
// GET MY PROFILE
// ======================================================

const getMyProfile = async (req, res) => {
  try {
    const user = req.user;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });

  } catch (error) {
    console.error("[GET MY PROFILE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// ======================================================
// GET USER PROFILE BY ADMIN
// ======================================================

const getUserProfileByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });

  } catch (error) {
    console.error("[GET USER PROFILE BY ADMIN ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

module.exports = {
  getMyProfile,
  getUserProfileByAdmin,
};