<script lang="ts">
	import "../app.css";
	import favicon from "$lib/assets/favicon.svg";
	import Navbar from "$lib/components/Navbar.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="h-screen flex flex-col overflow-hidden">
	<Navbar />
	<div class="flex-1 overflow-y-auto">
		{@render children()}
	</div>
</div>
