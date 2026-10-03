const {
    createClient
} = require("@supabase/supabase-js");


// ==========================================
// BLOCKWORLD SUPABASE
// ==========================================

const SUPABASE_URL =
    "https://rprqpkcmyuwvqkzfiqbi.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_kTzqdJhND_1X2nmE1_lszQ_1NO5-6vf";


const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                flowType: "pkce",
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
            }
        }
    );


module.exports = supabase;