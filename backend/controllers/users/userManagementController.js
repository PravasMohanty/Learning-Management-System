const { supabaseAdmin: supabase } = require("../../config/supabase");

// ======================================================
// LOCK USER ACCOUNT
// ======================================================

const lockUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_locked: true,
      })
      .eq("id", userId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to lock user account",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User account locked successfully",
    });

  } catch (error) {
    console.error("[LOCK USER ACCOUNT ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to lock user account",
    });
  }
};

// ======================================================
// UNLOCK USER ACCOUNT
// ======================================================

const unlockUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_locked: false,
      })
      .eq("id", userId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to unlock user account",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User account unlocked successfully",
    });

  } catch (error) {
    console.error("[UNLOCK USER ACCOUNT ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unlock user account",
    });
  }
};

// ======================================================
// LIST USERS
// ======================================================

const listUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, is_locked, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error("[LIST USERS ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// ======================================================
// DELETE USER
// ======================================================

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error("[DELETE USER ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  lockUserAccount,
  unlockUserAccount,
  listUsers,
  deleteUser,
};