const { supabaseAdmin: supabase } = require("../../config/supabase");
const generateUserCode = require("../../utils/generateUserCode");

const fs = require("fs");

const path = require("path");

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
          await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
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
            user_code: generateUserCode(),
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

    // Clean up uploaded CSV file
    try {
      fs.unlinkSync(file.path);
    } catch (cleanupErr) {
      console.error("[CSV CLEANUP ERROR]", cleanupErr);
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

// ======================================================
// DOWNLOAD CSV TEMPLATE
// ======================================================

const downloadCSVTemplate = async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../../templates/student_upload_template.csv"
    );

    return res.download(filePath);

  } catch (error) {
    console.error("[DOWNLOAD CSV TEMPLATE ERROR]", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download CSV template",
    });
  }
};

module.exports = {
  downloadCSVTemplate,
  createUsersFromCSV,
};