const { supabase } = require("../../config/supabaseClient");

const csvUserReader = require("../../utils/csvUserReader");

// ======================================================
// CREATE USERS FROM CSV
// ======================================================

const createUsersFromCSV = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    const users = await csvUserReader(file.path);

    const createdUsers = [];
    const failedUsers = [];

    for (const user of users) {
      try {
        const {
          name,
          email,
          password,
        } = user;

        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (authError) {
          failedUsers.push({
            email,
            reason: authError.message,
          });

          continue;
        }

        const authUser = authData.user;

        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authUser.id,
            name,
            email,
            role: "student",
            is_locked: false,
          });

        if (profileError) {
          failedUsers.push({
            email,
            reason: profileError.message,
          });

          continue;
        }

        createdUsers.push({
          id: authUser.id,
          email,
        });

      } catch (error) {
        failedUsers.push({
          email: user.email,
          reason: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "CSV user import completed",

      data: {
        created_count: createdUsers.length,
        failed_count: failedUsers.length,
        created_users: createdUsers,
        failed_users: failedUsers,
      },
    });

  } catch (error) {
    console.error("[CREATE USERS FROM CSV ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create users from CSV",
    });
  }
};

module.exports = {
  createUsersFromCSV,
};