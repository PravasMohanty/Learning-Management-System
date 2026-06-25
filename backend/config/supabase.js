const { createClient } = require("@supabase/supabase-js");

let supabase = null;
let supabaseAdmin = null;

try {
    const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            "Missing SUPABASE_PROJECT_URL or SUPABASE_SECRET_KEY"
        );
    }

    // Main client — used for auth operations (signInWithPassword, etc.)
    supabase = createClient(supabaseUrl, supabaseKey);

    // Admin client — dedicated to DB queries, always uses service_role context.
    // This avoids RLS issues caused by signInWithPassword changing the
    // auth context on the main client.
    supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    console.log("✅ Supabase initialized successfully");

} catch (err) {
    console.error("❌ Supabase connection failed:");
    console.error(err.message);
}

module.exports = { supabase, supabaseAdmin };