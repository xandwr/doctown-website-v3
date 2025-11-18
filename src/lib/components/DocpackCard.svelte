<script lang="ts">
	import type { Docpack } from "$lib/types";
	import { STATUS_CONFIG } from "$lib/types";

	let { docpack }: { docpack: Docpack } = $props();

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
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
	class="bg-concrete/30 border border-fog p-4 hover:border-ash transition-all cursor-pointer"
>
	<div class="flex items-start justify-between mb-2">
		<h3 class="text-lg font-semibold text-whisper flex-1">
			{docpack.full_name.replace('/', ':')}
		</h3>
		<span
			class="ml-2 px-2 py-0.5 text-xs border font-mono {statusColorClasses[
				statusConfig.color
			]}"
			title={statusConfig.description}
		>
			{statusConfig.label}
		</span>
	</div>

	{#if docpack.description}
		<p class="text-echo text-sm mb-3 line-clamp-2">
			{docpack.description}
		</p>
	{/if}

	<div class="flex items-center justify-between text-xs">
		<span class="text-shadow">
			Updated {formatDate(docpack.updated_at)}
		</span>
		{#if docpack.version}
			<span class="text-shadow font-mono">
				v{docpack.version}
			</span>
		{/if}
	</div>
</div>
