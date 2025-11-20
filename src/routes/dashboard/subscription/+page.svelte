<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let loading = $state(false);
  let error = $state<string | null>(null);

  const subscription = $derived(data.subscription);
  const hasSubscription = $derived(!!subscription);
  const isActive = $derived(
    subscription &&
      (subscription.status === "active" || subscription.status === "trialing"),
  );

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border border-success/30";
      case "trialing":
        return "bg-primary/10 text-primary border border-primary/30";
      case "past_due":
        return "bg-warning/10 text-warning border border-warning/30";
      case "canceled":
        return "bg-danger/10 text-danger border border-danger/30";
      default:
        return "bg-bg-elevated text-text-secondary border border-border-default";
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "active":
        return "Active";
      case "trialing":
        return "Trial";
      case "past_due":
        return "Past Due";
      case "canceled":
        return "Canceled";
      case "incomplete":
        return "Incomplete";
      default:
        return status;
    }
  }

  async function handleManageSubscription() {
    loading = true;
    error = null;

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create portal session");
      }

      // Redirect to Stripe Customer Portal
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      error = err.message;
      loading = false;
    }
  }
</script>

<div class="h-full p-8">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <a
        href="/dashboard"
        class="text-primary hover:text-primary-hover font-mono text-sm inline-flex items-center"
      >
        <svg
          class="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </a>
    </div>

    <h1 class="text-3xl font-bold text-text-primary mb-8">Subscription</h1>

    {#if error}
      <div class="bg-danger/10 border border-danger/30 rounded-sm p-4 mb-6">
        <p class="text-danger font-mono text-sm">{error}</p>
      </div>
    {/if}

    {#if hasSubscription && subscription}
      <div class="bg-bg-secondary border border-border-default rounded-sm overflow-hidden">
        <div class="px-6 py-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-text-primary">
              Doctown Premium
            </h2>
            <span
              class="px-3 py-1 rounded-sm text-xs font-mono {getStatusBadgeClass(
                subscription.status,
              )}"
            >
              {getStatusText(subscription.status)}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <p class="text-xs text-text-tertiary mb-1 font-mono">Plan</p>
              <p class="text-lg font-bold text-text-primary">$10 CAD / month</p>
            </div>

            {#if isActive}
              <div>
                <p class="text-xs text-text-tertiary mb-1 font-mono">Next billing date</p>
                <p class="text-lg font-bold text-text-primary">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            {/if}

            {#if subscription.cancel_at_period_end}
              <div class="md:col-span-2">
                <div
                  class="bg-warning/10 border border-warning/30 rounded-sm p-4"
                >
                  <p class="text-warning font-mono text-sm">
                    Your subscription will be canceled on {formatDate(
                      subscription.current_period_end,
                    )}
                  </p>
                  <p class="text-warning/80 text-xs mt-1 font-mono">
                    You'll still have access until the end of your billing
                    period.
                  </p>
                </div>
              </div>
            {/if}
          </div>

          <div class="border-t border-border-default pt-6">
            <button
              onclick={handleManageSubscription}
              disabled={loading}
              class="bg-primary hover:bg-primary-hover text-white font-mono py-2 px-6 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
            <p class="text-xs text-text-tertiary mt-3 font-mono">
              Update payment method, billing information, or cancel your
              subscription
            </p>
          </div>
        </div>
      </div>

      <!-- Subscription Features -->
      <div class="mt-8 bg-bg-secondary/50 border border-border-default rounded-sm p-6">
        <h3 class="text-base font-bold text-text-primary mb-4">
          Your Premium Benefits
        </h3>
        <ul class="space-y-3">
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-success mr-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span class="text-sm text-text-secondary">Docpack generation</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-success mr-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span class="text-sm text-text-secondary">Access to all your repositories</span>
          </li>
          <li class="flex items-start">
            <span class="text-sm text-text-tertiary">Automatic updates for tracked branches <i>(Coming Soon!)</i></span>
          </li>
        </ul>
      </div>
    {:else}
      <div class="bg-bg-secondary border border-border-default rounded-sm p-8 text-center">
        <svg
          class="mx-auto h-12 w-12 text-text-tertiary mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 class="text-xl font-bold text-text-primary mb-2">
          No Active Subscription
        </h2>
        <p class="text-sm text-text-secondary mb-6">
          Subscribe to Doctown Premium to generate documentation for your
          repositories
        </p>
        <a
          href="/dashboard/subscribe"
          class="inline-block bg-primary hover:bg-primary-hover text-white font-mono py-3 px-8 rounded-sm transition-colors"
        >
          View Plans
        </a>
      </div>
    {/if}
  </div>
</div>
