import type { Handle } from "@sveltejs/kit";
import { getSession, hasActiveSubscription } from "$lib/supabase";

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get("session_id");

  if (sessionToken) {
    try {
      const session = (await getSession(sessionToken)) as any;
      if (session && "users" in session && session.users) {
        // Session is valid and not expired
        event.locals.user = session.users;
        event.locals.accessToken = session.users.access_token;
        event.locals.userRole = session.users.role || "user";

        // Check subscription status
        event.locals.hasActiveSubscription = await hasActiveSubscription(
          session.users.id,
        );
      } else {
        // Session expired or not found, clear cookie
        event.cookies.delete("session_id", { path: "/" });
      }
    } catch (error) {
      console.error("Error retrieving session:", error);
      event.cookies.delete("session_id", { path: "/" });
    }
  }

  return resolve(event);
};
