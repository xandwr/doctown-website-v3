<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let loading = $state(false);
  let error = $state<string | null>(null);

  const subscription = $derived(data.subscription);
  const hasSubscription = $derived(!!subscription);
  const isActive = $derived(
    subscription &&
      (subscription.status === "active" || subscription.status === "trialing")
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
        return "bg-green-100 text-green-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <a
        href="/dashboard"
        class="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
      >
        <svg
          class="w-5 h-5 mr-2"
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

    <h1 class="text-3xl font-bold text-gray-900 mb-8">Subscription</h1>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}

    {#if hasSubscription && subscription}
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="px-6 py-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-gray-900">
              Doctown Premium
            </h2>
            <span
              class="px-3 py-1 rounded-full text-sm font-semibold {getStatusBadgeClass(
                subscription.status
              )}"
            >
              {getStatusText(subscription.status)}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <p class="text-sm text-gray-600 mb-1">Plan</p>
              <p class="text-lg font-medium text-gray-900">$10 CAD / month</p>
            </div>

            {#if isActive}
              <div>
                <p class="text-sm text-gray-600 mb-1">Next billing date</p>
                <p class="text-lg font-medium text-gray-900">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            {/if}

            {#if subscription.cancel_at_period_end}
              <div class="md:col-span-2">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p class="text-yellow-800 font-medium">
                    Your subscription will be canceled on {formatDate(
                      subscription.current_period_end
                    )}
                  </p>
                  <p class="text-yellow-700 text-sm mt-1">
                    You'll still have access until the end of your billing period.
                  </p>
                </div>
              </div>
            {/if}
          </div>

          <div class="border-t border-gray-200 pt-6">
            <button
              onclick={handleManageSubscription}
              disabled={loading}
              class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
            <p class="text-sm text-gray-500 mt-3">
              Update payment method, billing information, or cancel your subscription
            </p>
          </div>
        </div>
      </div>

      <!-- Subscription Features -->
      <div class="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Your Premium Benefits
        </h3>
        <ul class="space-y-3">
          <li class="flex items-start">
            <svg
              class="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
            <span class="text-gray-700">Unlimited docpack generation</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
            <span class="text-gray-700">Access to all your repositories</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
            <span class="text-gray-700"
              >Automatic updates for tracked branches</span
            >
          </li>
          <li class="flex items-start">
            <svg
              class="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
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
            <span class="text-gray-700">Priority build queue</span>
          </li>
        </ul>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <svg
          class="mx-auto h-12 w-12 text-gray-400 mb-4"
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
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">
          No Active Subscription
        </h2>
        <p class="text-gray-600 mb-6">
          Subscribe to Doctown Premium to generate documentation for your repositories
        </p>
        <a
          href="/dashboard/subscribe"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          View Plans
        </a>
      </div>
    {/if}
  </div>
</div>
