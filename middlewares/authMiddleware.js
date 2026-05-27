const { supabase } = require("../config/supabase");

const authMiddleware = async (req, res, next) => {
  try {
    // ==========================================
    // GET TOKEN
    // ==========================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token missing",
      });
    }

    // ==========================================
    // EXTRACT TOKEN
    // ==========================================

    const token = authHeader.split(" ")[1];

    // ==========================================
    // VERIFY USER
    // ==========================================

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // ==========================================
    // FETCH PROFILE
    // ==========================================

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

    // ==========================================
    // ATTACH USER
    // ==========================================

    req.user = profile;

    next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = authMiddleware;