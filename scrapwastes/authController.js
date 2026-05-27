// ======================================================
// AUTH CONTROLLER FOR LMS
// ======================================================

const bcrypt = require("bcryptjs");
const { supabase } = require("../config/supabase");

// ======================================================
// ADMIN REGISTER
// ======================================================

const adminRegister = async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !email || !password || !adminCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ==========================================
    // VERIFY ADMIN CODE
    // ==========================================

    if (adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin code",
      });
    }

    // ==========================================
    // CREATE AUTH USER
    // ==========================================

    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: authError.message,
      });
    }

    const user = authData.user;

    // ==========================================
    // CREATE PROFILE
    // ==========================================

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          name,
          email,
          role: "admin",
        },
      ]);

    if (profileError) {
      return res.status(500).json({
        success: false,
        message: "Admin created but profile creation failed",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: user.id,
        email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("[ADMIN REGISTER ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Admin registration failed",
    });
  }
};

// ======================================================
// STUDENT REGISTRATION REQUEST
// ======================================================

const studentRegisterRequest = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ==========================================
    // CHECK EXISTING REQUEST
    // ==========================================

    const { data: existingRequest } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("email", email)
      .single();

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Registration request already exists",
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ==========================================
    // CREATE REQUEST
    // ==========================================

    const { error } = await supabase
      .from("registration_requests")
      .insert([
        {
          name,
          email,
          password_hash: hashedPassword,
          status: "pending",
        },
      ]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

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

// ======================================================
// LOGIN
// ======================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // ==========================================
    // LOGIN
    // ==========================================

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

    // ==========================================
    // FETCH PROFILE
    // ==========================================

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

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
// GET PROFILE
// ======================================================

const getProfile = async (req, res) => {
  try {
    const user = req.user;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
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
    console.error("[GET PROFILE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// ======================================================
// LOGOUT
// ======================================================

const logout = async (req, res) => {
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
  adminRegister,
  studentRegisterRequest,
  login,
  getProfile,
  logout,
};