import type { LayoutServerLoad } from "./$types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "$env/static/private";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user || null,
    hasActiveSubscription: locals.hasActiveSubscription || false,
    supabase: {
      url: SUPABASE_URL,
      key: SUPABASE_PUBLISHABLE_KEY,
    },
  };
};
