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

	// Color classes for status badges - liminal palette
	const statusColorClasses: Record<string, string> = {
		orange: "bg-rust/20 text-rust border-rust/40",
		green: "bg-corpse/20 text-corpse border-corpse/40",
		cyan: "bg-corpse/20 text-corpse border-corpse/40",
		red: "bg-decay/20 text-decay border-decay/40",
	};
</script>

<div
	class="bg-concrete/30 border border-fog rounded-sm p-4 hover:border-ash transition-all cursor-pointer"
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
				class="text-lg font-semibold text-whisper cursor-copy hover:text-corpse transition-colors hover:bg-neutral-800/50 rounded-md px-4 border-2 border-neutral-800/50"
				onclick={copyToClipboard}
				title="Click to copy"
			>
				{docpack.full_name.replace("/", ":")}
			</button>
			<!-- Tooltip that transitions between states -->
			<span
				class="absolute left-0 bottom-full mb-1 px-2 py-1 bg-[#0a0a0a] text-xs font-mono border rounded-sm pointer-events-none whitespace-nowrap z-10 transition-all duration-300 {showCopiedTooltip
					? 'text-corpse border-corpse/40 opacity-100'
					: 'text-whisper border-ash opacity-0 group-hover:opacity-100'}"
			>
				{showCopiedTooltip ? "Copied!" : "Click to copy"}
			</span>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<span class="text-shadow text-xs whitespace-nowrap">
				{formatDate(docpack.updated_at)}
			</span>
			<span
				class="px-2 py-0.5 text-xs border rounded-sm font-mono {statusColorClasses[
					statusConfig.color
				]}"
				title={statusConfig.description}
			>
				{statusConfig.label}
			</span>
		</div>
	</div>

	<div class="mb-2">
		<span class="text-shadow text-xs font-mono">Description:</span>
		<p class="text-echo text-sm line-clamp-2 mt-1">
			{docpack.description || "No description provided"}
		</p>
	</div>

	<div class="flex items-center justify-between gap-2 mt-3">
		{#if docpack.version}
			<div class="text-xs">
				<span class="text-shadow font-mono">
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
				class="text-xs font-mono px-3 py-1 bg-corpse/10 hover:bg-corpse/20 text-corpse border border-corpse/40 rounded-sm transition-colors"
			>
				View Docs
			</a>
		{/if}
	</div>
</div>
