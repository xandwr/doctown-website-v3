import { json, type RequestEvent } from "@sveltejs/kit";
import Stripe from "stripe";
import { env } from "$env/dynamic/private";
import {
  upsertSubscription,
  getSubscriptionByStripeId,
  supabase,
} from "$lib/supabase";

const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const POST = async ({ request }: RequestEvent) => {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return json({ error: "No signature provided" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        if (invoice.subscription && typeof invoice.subscription === "string") {
          // Fetch the subscription to get updated data
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription,
          );
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        if (invoice.subscription && typeof invoice.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription,
          );
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return json({ error: error.message }, { status: 500 });
  }
};

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find the user by Stripe customer ID
  const { data: existingSubscription, error: subError } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  let userId: string;

  if (existingSubscription && !subError) {
    userId = (existingSubscription as any).user_id;
  } else {
    // If no existing subscription, get user from customer metadata
    const customer = (await stripe.customers.retrieve(
      customerId,
    )) as Stripe.Customer;

    if (!customer.metadata?.user_id) {
      throw new Error(`No user_id found in customer ${customerId} metadata`);
    }

    userId = customer.metadata.user_id;
  }

  // Map Stripe status to our database status
  let status: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
  switch (subscription.status) {
    case "active":
      status = "active";
      break;
    case "canceled":
      status = "canceled";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "incomplete":
    case "incomplete_expired":
      status = "incomplete";
      break;
    case "trialing":
      status = "trialing";
      break;
    case "unpaid":
      status = "past_due";
      break;
    default:
      status = "incomplete";
  }

  // Get period dates from subscription items (new Stripe API structure)
  const subscriptionItem = (subscription as any).items?.data?.[0];
  const periodStart =
    subscriptionItem?.current_period_start || (subscription as any).start_date;
  const periodEnd = subscriptionItem?.current_period_end;

  if (!periodStart || !periodEnd) {
    throw new Error(`Missing period dates for subscription ${subscription.id}`);
  }

  await upsertSubscription({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status,
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end || false,
  });

  console.log(`Updated subscription for user ${userId}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existingSub = await getSubscriptionByStripeId(subscription.id);

  if (!existingSub) {
    console.log(`No subscription found for ${subscription.id}`);
    return;
  }

  // Get period dates from subscription items (new Stripe API structure)
  const subscriptionItem = (subscription as any).items?.data?.[0];
  const periodStart =
    subscriptionItem?.current_period_start || (subscription as any).start_date;
  const periodEnd = subscriptionItem?.current_period_end;

  if (!periodStart || !periodEnd) {
    console.error(
      `Missing period dates for deleted subscription ${subscription.id}`,
    );
    return;
  }

  await upsertSubscription({
    user_id: existingSub.user_id,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    status: "canceled",
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: true,
  });

  console.log(`Deleted subscription for user ${existingSub.user_id}`);
}
