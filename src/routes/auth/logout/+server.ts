import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { deleteSession } from "$lib/supabase";

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionToken = cookies.get("session_id");

  if (sessionToken) {
    try {
      await deleteSession(sessionToken);
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  }

  // Delete the session cookie
  cookies.delete("session_id", { path: "/" });

  throw redirect(303, "/");
};
