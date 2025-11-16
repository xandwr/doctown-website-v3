<script lang="ts">
	interface GitHubRepo {
		id: number;
		name: string;
		full_name: string;
		description: string | null;
		html_url: string;
		private: boolean;
		updated_at: string;
		stargazers_count: number;
		language: string | null;
	}

	let {
		repo,
		onClick,
		isSelected = false,
	}: {
		repo: GitHubRepo;
		onClick: (event: MouseEvent) => void;
		isSelected?: boolean;
	} = $props();

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	function handleClick(event: MouseEvent) {
		onClick(event);
	}

	function getLanguageColor(language: string): string {
		const colors: Record<string, string> = {
			JavaScript: "bg-yellow-400",
			TypeScript: "bg-blue-500",
			Python: "bg-blue-400",
			Java: "bg-orange-600",
			Go: "bg-cyan-400",
			Rust: "bg-orange-500",
			Ruby: "bg-red-500",
			PHP: "bg-indigo-400",
			C: "bg-gray-500",
			"C++": "bg-pink-500",
			"C#": "bg-purple-500",
			Swift: "bg-orange-400",
			Kotlin: "bg-purple-400",
			Dart: "bg-blue-400",
			HTML: "bg-orange-500",
			CSS: "bg-blue-500",
			Shell: "bg-green-500",
			Svelte: "bg-orange-600",
			Vue: "bg-emerald-500",
			React: "bg-cyan-400",
			Dockerfile: "bg-blue-600",
			Makefile: "bg-orange-400",
		};
		return colors[language] || "bg-cyan-500";
	}
</script>

<button
	onclick={handleClick}
	class="w-full text-left bg-black/20 rounded p-4 hover:bg-zinc-950 transition-all group cursor-pointer {isSelected
		? 'border-2 border-cyan-500/70 shadow-lg shadow-cyan-500/20'
		: 'border border-white/10 hover:border-cyan-500/50'}"
>
	<div class="flex items-center gap-2 mb-2">
		<h3
			class="text-base font-bold text-white truncate flex-1 font-mono group-hover:text-cyan-400 transition-colors"
		>
			{repo.name}
		</h3>
		{#if repo.private}
			<span
				class="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded font-mono shrink-0"
			>
				Private
			</span>
		{:else}
			<span
				class="px-2 py-0.5 text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded font-mono shrink-0"
			>
				Public
			</span>
		{/if}
	</div>

	{#if repo.description}
		<p class="text-white/50 text-xs mb-3 line-clamp-2 font-light">
			{repo.description}
		</p>
	{/if}

	<div class="flex items-center gap-3 text-xs text-white/40 font-mono">
		{#if repo.language}
			<span class="flex items-center gap-1.5">
				<span
					class="w-2 h-2 rounded-full {getLanguageColor(
						repo.language,
					)}"
				></span>
				{repo.language}
			</span>
		{/if}
		{#if repo.stargazers_count > 0}
			<span class="flex items-center gap-1">
				<span class="text-yellow-500">★</span>
				{repo.stargazers_count}
			</span>
		{/if}
		<span class="ml-auto">{formatDate(repo.updated_at)}</span>
	</div>
</button>
