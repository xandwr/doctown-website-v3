<script lang="ts">
	import type { Docpack } from "$lib/types";
	import { STATUS_CONFIG } from "$lib/types";

	let { docpack }: { docpack: Docpack } = $props();

	let showCopiedTooltip = $state(false);

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	async function copyToClipboard(event: MouseEvent) {
		event.stopPropagation(); // Prevent opening the modal
		const textToCopy = docpack.full_name.replace("/", ":");

		try {
			await navigator.clipboard.writeText(textToCopy);
			showCopiedTooltip = true;
			setTimeout(() => {
				showCopiedTooltip = false;
			}, 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}

	const statusConfig = $derived(STATUS_CONFIG[docpack.status]);

	// Status badge styling - semantic, vibrant colors
	const statusClasses = $derived(
		docpack.status === "building" ? "bg-status-building/10 text-status-building border-status-building/30" :
		docpack.status === "pending" ? "bg-warning/10 text-warning border-warning/30" :
		docpack.status === "valid" ? "bg-status-valid/10 text-status-valid border-status-valid/30" :
		docpack.status === "public" ? "bg-status-public/10 text-status-public border-status-public/30" :
		docpack.status === "failed" ? "bg-status-failed/10 text-status-failed border-status-failed/30" :
		"bg-border-default/10 text-text-secondary border-border-default"
	);
</script>

<div
	class="bg-bg-secondary border border-border-default rounded-sm p-4 hover:border-border-strong transition-all cursor-pointer"
>
	<!-- Top row: Name, Status Badge, and Updated Date -->
	<div class="flex items-center justify-between gap-2 mb-2">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative group"
			onmouseleave={() => (showCopiedTooltip = false)}
		>
			<button
				class="text-lg font-semibold text-text-primary cursor-copy hover:text-primary transition-colors hover:bg-hover-bg rounded-md px-4 border-2 border-border-subtle"
				onclick={copyToClipboard}
				title="Click to copy"
			>
				{docpack.full_name.replace("/", ":")}
			</button>
			<!-- Tooltip that transitions between states -->
			<span
				class="absolute left-0 bottom-full mb-1 px-2 py-1 bg-bg-primary text-xs font-mono border rounded-sm pointer-events-none whitespace-nowrap z-10 transition-all duration-300 {showCopiedTooltip
					? 'text-success border-success/40 opacity-100'
					: 'text-text-primary border-border-default opacity-0 group-hover:opacity-100'}"
			>
				{showCopiedTooltip ? "Copied!" : "Click to copy"}
			</span>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<span class="text-text-tertiary text-xs whitespace-nowrap">
				{formatDate(docpack.updated_at)}
			</span>
			<span
				class="px-2 py-0.5 text-xs border rounded-sm font-mono {statusClasses}"
				title={statusConfig.description}
			>
				{statusConfig.label}
			</span>
		</div>
	</div>

	<div class="mb-2">
		<span class="text-text-tertiary text-xs font-mono">Description:</span>
		<p class="text-text-secondary text-sm line-clamp-2 mt-1">
			{docpack.description || "No description provided"}
		</p>
	</div>

	<div class="flex items-center justify-between gap-2 mt-3">
		{#if docpack.version}
			<div class="text-xs">
				<span class="text-text-tertiary font-mono">
					v{docpack.version}
				</span>
			</div>
		{:else}
			<div></div>
		{/if}

		{#if docpack.status === "public" || docpack.status === "valid"}
			<a
				href="/docpacks/{docpack.id}"
				onclick={(e) => e.stopPropagation()}
				class="text-xs font-mono px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-sm transition-colors"
			>
				View Docs
			</a>
		{/if}
	</div>
</div>
