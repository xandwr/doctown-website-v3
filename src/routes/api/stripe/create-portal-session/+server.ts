import { json, type RequestEvent } from "@sveltejs/kit";
import Stripe from "stripe";
import { env } from "$env/dynamic/private";
import { getUserSubscription } from "$lib/supabase";

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const POST = async ({ locals, url }: RequestEvent) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's subscription to find their Stripe customer ID
    const subscription = await getUserSubscription(locals.user.id);

    if (!subscription) {
      return json({ error: "No subscription found" }, { status: 404 });
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${url.origin}/dashboard/subscription`,
    });

    return json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    return json({ error: error.message }, { status: 500 });
  }
};
