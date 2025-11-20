<script lang="ts">
  import { onMount } from "svelte";
  import TownVisualization from "$lib/components/TownVisualization.svelte";

  interface TownUser {
    id: string;
    github_login: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
  }

  let users: TownUser[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      users = await response.json();
    } catch (err) {
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Town - Doctown</title>
  <meta
    name="description"
    content="Meet everyone who's part of Doctown! An interactive visualization of our community."
  />
</svelte:head>

<div class="h-screen w-full flex flex-col">
  {#if loading}
    <div class="flex-1 flex items-center justify-center bg-gray-950">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"
        ></div>
        <p class="text-text-secondary">Loading Town...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex-1 flex items-center justify-center bg-gray-950">
      <div class="text-center max-w-md px-4">
        <p class="text-danger text-lg mb-2">Error loading Town</p>
        <p class="text-text-secondary">{error}</p>
        <button
          onclick={() => window.location.reload()}
          class="mt-4 bg-primary text-white px-4 py-2 rounded-sm hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  {:else if users.length === 0}
    <div class="flex-1 flex items-center justify-center bg-gray-950">
      <div class="text-center max-w-md px-4">
        <p class="text-text-secondary text-lg">
          Town is empty! Be the first to join.
        </p>
      </div>
    </div>
  {:else}
    <div class="flex-1">
      <TownVisualization {users} />
    </div>
  {/if}
</div>
