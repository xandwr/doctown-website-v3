import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getUserSubscription } from "$lib/supabase";

export const load: PageServerLoad = async ({ locals, url }) => {
  // Redirect to home if not authenticated
  if (!locals.user) {
    throw redirect(303, "/");
  }

  // Check if user already has active subscription
  const subscription = await getUserSubscription(locals.user.id);

  // If they have an active subscription, redirect to dashboard
  if (
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing")
  ) {
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    if (periodEnd > now) {
      throw redirect(303, "/dashboard");
    }
  }

  const canceled = url.searchParams.get("canceled") === "true";

  return {
    user: locals.user,
    canceled,
  };
};
