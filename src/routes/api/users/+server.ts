import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";

/**
 * API endpoint to fetch all registered users for the Town visualization.
 * Returns public user information (avatar, name, login).
 */
export const GET: RequestHandler = async () => {
  try {
    // Fetch all users with only public information, sorted by join date
    const { data: users, error } = await supabase
      .from("users")
      .select("id, github_login, name, avatar_url, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(users || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
