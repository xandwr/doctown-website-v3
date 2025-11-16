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

	// Color classes for status badges
	const statusColorClasses: Record<string, string> = {
		orange: "bg-orange-500/20 text-orange-400 border-orange-500/40",
		green: "bg-green-500/20 text-green-400 border-green-500/40",
		cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
		red: "bg-red-500/20 text-red-400 border-red-500/40",
	};
</script>

<div
	class="bg-zinc-900 border border-white/20 rounded-lg p-4 hover:border-white/40 transition-all cursor-pointer hover:shadow-lg hover:shadow-white/10"
>
	<div class="flex items-start justify-between mb-2">
		<h3 class="text-lg font-semibold text-white flex-1">
			{docpack.name}
		</h3>
		<span
			class="ml-2 px-2 py-0.5 text-xs rounded border font-mono {statusColorClasses[
				statusConfig.color
			]}"
			title={statusConfig.description}
		>
			{statusConfig.label}
		</span>
	</div>

	{#if docpack.description}
		<p class="text-white/60 text-sm mb-3 line-clamp-2">
			{docpack.description}
		</p>
	{/if}

	<div class="flex items-center justify-between text-xs">
		<span class="text-white/50">
			Updated {formatDate(docpack.updated_at)}
		</span>
		{#if docpack.version}
			<span class="text-white/40 font-mono">
				v{docpack.version}
			</span>
		{/if}
	</div>
</div>
