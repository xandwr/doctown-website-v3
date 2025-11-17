import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Get Supabase credentials from the server
// These will be passed from the layout
let supabaseUrl: string;
let supabaseKey: string;

export function initSupabaseClient(url: string, key: string) {
  supabaseUrl = url;
  supabaseKey = key;
}

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase client not initialized. Call initSupabaseClient first.",
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}
