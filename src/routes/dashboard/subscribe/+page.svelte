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

<div class="h-full p-8">
  <div class="max-w-3xl mx-auto">
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

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text-primary mb-2">
        Subscribe to Doctown Premium
      </h1>
      <p class="text-text-secondary">
        Get unlimited access to generate and manage documentation for your
        repositories
      </p>
    </div>

    {#if (data as any).canceled}
      <div class="bg-warning/10 border border-warning/30 rounded-sm p-4 mb-6">
        <p class="text-warning font-mono text-sm">
          Checkout was canceled. You can try again when you're ready.
        </p>
      </div>
    {/if}

    {#if error}
      <div class="bg-danger/10 border border-danger/30 rounded-sm p-4 mb-6">
        <p class="text-danger font-mono text-sm">{error}</p>
      </div>
    {/if}

    <!-- Pricing Card -->
    <div class="bg-bg-secondary border border-border-default rounded-sm overflow-hidden">
      <div class="px-6 py-8 bg-primary/10 border-b border-primary/30">
        <div class="flex justify-center">
          <span
            class="inline-flex px-3 py-1 rounded-sm text-xs font-mono tracking-wide uppercase bg-primary/20 text-primary border border-primary/30"
          >
            Premium
          </span>
        </div>
        <div
          class="mt-4 flex justify-center items-baseline text-text-primary"
        >
          <span class="text-5xl font-bold">$10</span>
          <span class="ml-2 text-lg text-text-secondary font-mono">CAD/month</span>
        </div>
      </div>
      <div class="px-6 py-8">
        <ul class="space-y-4">
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-success"
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
            <p class="ml-3 text-sm text-text-secondary">
              Unlimited docpack generation
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-success"
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
            <p class="ml-3 text-sm text-text-secondary">
              Access to all GitHub repositories
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-success"
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
            <p class="ml-3 text-sm text-text-secondary">
              Private and public docpacks
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-success"
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
            <p class="ml-3 text-sm text-text-secondary">
              Automatic updates for tracked branches
            </p>
          </li>
          <li class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-success"
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
            <p class="ml-3 text-sm text-text-secondary">Cancel anytime</p>
          </li>
        </ul>
        <div class="mt-8">
          <button
            onclick={handleSubscribe}
            disabled={loading}
            class="w-full bg-primary hover:bg-primary-hover text-white font-mono py-3 px-6 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </button>
        </div>
        <p class="mt-4 text-xs text-text-tertiary text-center font-mono">
          Secure payment processing by Stripe. Cancel anytime from your account
          settings.
        </p>
      </div>
    </div>

    <!-- Free Access Note -->
    <div class="mt-8 bg-bg-secondary/50 border border-border-default rounded-sm p-6">
      <h2 class="text-base font-bold text-text-primary mb-2">
        Browse the Commons for Free
      </h2>
      <p class="text-sm text-text-secondary">
        You can still browse and view all public documentation in the Commons
        without a subscription. A premium subscription is only required to
        generate new docpacks.
      </p>
      <a
        href="/commons"
        class="inline-block mt-4 text-primary hover:text-primary-hover font-mono text-sm"
      >
        Explore the Commons →
      </a>
    </div>
  </div>
</div>
