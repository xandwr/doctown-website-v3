import { json, type RequestEvent } from "@sveltejs/kit";
import Stripe from "stripe";
import { env } from "$env/dynamic/private";

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const POST = async ({ request, locals, url }: RequestEvent) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceId } = await request.json();

    if (!priceId) {
      return json({ error: "Price ID is required" }, { status: 400 });
    }

    // Check if user already has a Stripe customer ID
    let customerId: string;

    // Try to find existing customer by email or create new one
    const customers = await stripe.customers.list({
      email: locals.user.github_login
        ? `${locals.user.github_login}@users.noreply.github.com`
        : undefined,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: locals.user.github_login
          ? `${locals.user.github_login}@users.noreply.github.com`
          : undefined,
        metadata: {
          user_id: locals.user.id,
          github_login: locals.user.github_login,
        },
      });
      customerId = customer.id;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${url.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/dashboard/subscribe?canceled=true`,
      metadata: {
        user_id: locals.user.id,
      },
    });

    return json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return json({ error: error.message }, { status: 500 });
  }
};
