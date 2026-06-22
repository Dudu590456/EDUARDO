import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tnbrjlpocuzvruertsmn.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_xSGftvyOSLFK9YgeqsrJzQ_KJ5Mv8YP";

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export function isSupabaseConfigured() {
  return !!supabaseUrl && !!supabaseKey;
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  return supabaseClient;
}
