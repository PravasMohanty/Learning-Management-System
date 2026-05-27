const adminMiddleware = async (req, res, next) => {
  try {
    // ==========================================
    // CHECK USER EXISTS
    // ==========================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ==========================================
    // CHECK ROLE
    // ==========================================

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // ==========================================
    // USER IS ADMIN
    // ==========================================

    next();
  } catch (error) {
    console.error("[ADMIN MIDDLEWARE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

module.exports = adminMiddleware;