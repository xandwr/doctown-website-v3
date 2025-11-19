<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Stripe Price ID is provided from the server-side environment
  // and is available as `data.priceId` (see +page.server.ts).

  async function handleSubscribe() {
    loading = true;
    error = null;

    try {
      if (!(data as any)?.priceId) {
        throw new Error("Stripe price ID not configured");
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: (data as any).priceId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      error = err.message;
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-3xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Subscribe to Doctown Premium
      </h1>
      <p class="text-xl text-gray-600">
        Get unlimited access to generate and manage documentation for your
        repositories
      </p>
    </div>

    {#if (data as any).canceled}
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p class="text-yellow-800">
          Checkout was canceled. You can try again when you're ready.
        </p>
      </div>
    {/if}

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}

    <!-- Pricing Card -->
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <div
        class="px-6 py-8 bg-gradient-to-r from-blue-600 to-blue-700 sm:p-10 sm:pb-6"
      >
        <div class="flex justify-center">
          <span
            class="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600"
          >
            Premium
          </span>
        </div>
        <div
          class="mt-4 flex justify-center text-6xl font-extrabold text-white"
        >
          $10
          <span class="ml-3 text-2xl font-medium text-blue-100 self-end"
            >CAD/month</span
          >
        </div>
      </div>
      <div class="px-6 pt-6 pb-8 sm:p-10 sm:pt-6">
        <ul class="space-y-4">
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-6 w-6 text-green-500"
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
            </div>
            <p class="ml-3 text-base text-gray-700">
              Unlimited docpack generation
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-6 w-6 text-green-500"
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
            </div>
            <p class="ml-3 text-base text-gray-700">
              Access to all GitHub repositories
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-6 w-6 text-green-500"
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
            </div>
            <p class="ml-3 text-base text-gray-700">
              Private and public docpacks
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-6 w-6 text-green-500"
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
            </div>
            <p class="ml-3 text-base text-gray-700">
              Automatic updates for tracked branches
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-6 w-6 text-green-500"
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
            </div>
            <p class="ml-3 text-base text-gray-700">Priority build queue</p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-6 w-6 text-green-500"
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
            </div>
            <p class="ml-3 text-base text-gray-700">Cancel anytime</p>
          </li>
        </ul>
        <div class="mt-8">
          <button
            onclick={handleSubscribe}
            disabled={loading}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </button>
        </div>
        <p class="mt-4 text-sm text-gray-500 text-center">
          Secure payment processing by Stripe. Cancel anytime from your account
          settings.
        </p>
      </div>
    </div>

    <!-- Free Access Note -->
    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 class="text-lg font-semibold text-blue-900 mb-2">
        Browse the Commons for Free
      </h2>
      <p class="text-blue-800">
        You can still browse and view all public documentation in the Commons
        without a subscription. A premium subscription is only required to
        generate new docpacks.
      </p>
      <a
        href="/commons"
        class="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
      >
        Explore the Commons →
      </a>
    </div>
  </div>
</div>
