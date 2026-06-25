const { supabase, supabaseAdmin } = require("../config/supabase");

const authMiddleware = async (req, res, next) => {
  try {
    // ==========================================
    // GET TOKEN
    // ==========================================

    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token missing",
      });
    }

    // ==========================================
    // VERIFY USER
    // ==========================================

    // Use supabaseAdmin to avoid shared auth state issues.
    // The main supabase client's session gets mutated by
    // signInWithPassword calls, which can cause getUser()
    // to fail for other users' tokens.
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // ==========================================
    // FETCH PROFILE
    // ==========================================

    const { data: profile, error: profileError } = await supabaseAdmin
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

module.exports = {authMiddleware};