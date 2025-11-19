import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getUserSubscription } from "$lib/supabase";

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect to home if not authenticated
  if (!locals.user) {
    throw redirect(303, "/");
  }

  // Get user's subscription
  const subscription = await getUserSubscription(locals.user.id);

  return {
    user: locals.user,
    subscription,
  };
};
