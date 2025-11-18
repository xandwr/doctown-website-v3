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
		// Desaturated, liminal language colors
		const colors: Record<string, string> = {
			JavaScript: "bg-rust",
			TypeScript: "bg-corpse",
			Python: "bg-corpse",
			Java: "bg-rust",
			Go: "bg-corpse",
			Rust: "bg-rust",
			Ruby: "bg-decay",
			PHP: "bg-corpse",
			C: "bg-static",
			"C++": "bg-static",
			"C#": "bg-static",
			Swift: "bg-rust",
			Kotlin: "bg-static",
			Dart: "bg-corpse",
			HTML: "bg-rust",
			CSS: "bg-corpse",
			Shell: "bg-static",
			Svelte: "bg-rust",
			Vue: "bg-corpse",
			React: "bg-corpse",
			Dockerfile: "bg-corpse",
			Makefile: "bg-rust",
		};
		return colors[language] || "bg-corpse";
	}
</script>

<button
	onclick={handleClick}
	class="w-full text-left bg-concrete/30 p-4 hover:bg-fog/50 transition-all group cursor-pointer {isSelected
		? 'border border-corpse/70'
		: 'border border-fog hover:border-ash'}"
>
	<div class="flex items-center gap-2 mb-2">
		<h3
			class="text-base font-bold text-whisper truncate flex-1 font-mono group-hover:text-white transition-colors"
		>
			{repo.name}
		</h3>
		{#if repo.private}
			<span
				class="px-2 py-0.5 text-xs bg-static/20 text-shadow border border-static/50 font-mono shrink-0"
			>
				Private
			</span>
		{:else}
			<span
				class="px-2 py-0.5 text-xs bg-corpse/20 text-corpse border border-corpse/40 font-mono shrink-0"
			>
				Public
			</span>
		{/if}
	</div>

	{#if repo.description}
		<p class="text-echo text-xs mb-3 line-clamp-2 font-light">
			{repo.description}
		</p>
	{/if}

	<div class="flex items-center gap-3 text-xs text-shadow font-mono">
		{#if repo.language}
			<span class="flex items-center gap-1.5">
				<span
					class="w-2 h-2 {getLanguageColor(
						repo.language,
					)}"
				></span>
				{repo.language}
			</span>
		{/if}
		{#if repo.stargazers_count > 0}
			<span class="flex items-center gap-1">
				<span class="text-rust">★</span>
				{repo.stargazers_count}
			</span>
		{/if}
		<span class="ml-auto">{formatDate(repo.updated_at)}</span>
	</div>
</button>
