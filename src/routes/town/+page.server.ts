import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect to login if not authenticated
  if (!locals.user) {
    throw redirect(303, "/auth/login");
  }

  // Redirect to subscribe page if no active subscription
  if (!locals.hasActiveSubscription) {
    throw redirect(303, "/dashboard/subscribe");
  }

  // User is authenticated and has active subscription, allow access
  return {};
};
