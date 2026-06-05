const { createClient } = require("@supabase/supabase-js");

let supabase = null;

try {
    const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            "Missing SUPABASE_PROJECT_URL or SUPABASE_SECRET_KEY"
        );
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    console.log("✅ Supabase initialized successfully");

} catch (err) {
    console.error("❌ Supabase connection failed:");
    console.error(err.message);
}

module.exports = { supabase };