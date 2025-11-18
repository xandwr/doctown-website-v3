<script lang="ts">
	import { hasASTSupport, getLanguageTheme } from "$lib/languageSupport";

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

	// Check if repo has AST support and get theme
	const isSupported = hasASTSupport(repo.language);
	const theme = getLanguageTheme(repo.language);
</script>

<button
	onclick={handleClick}
	class="w-full text-left bg-concrete/30 p-4 hover:bg-fog/50 transition-all group cursor-pointer border {isSelected
		? 'border-corpse/70'
		: repo.language ? `${theme.borderColor} ${theme.hoverBorderColor}` : 'border-fog hover:border-ash'} {!isSupported && repo.language ? 'opacity-60' : ''}"
>
	<div class="flex items-center gap-2 mb-2">
		<h3
			class="text-base font-bold truncate flex-1 font-mono group-hover:text-white transition-colors {isSupported ? 'text-whisper' : 'text-shadow'}"
		>
			{repo.name}
		</h3>
		{#if isSupported && repo.language}
			<span
				class="px-2 py-0.5 text-xs bg-corpse/20 text-corpse border border-corpse/40 rounded-sm font-mono shrink-0"
				title="Full AST support available"
			>
				✓ AST
			</span>
		{/if}
		{#if repo.private}
			<span
				class="px-2 py-0.5 text-xs bg-static/20 text-shadow border border-static/50 rounded-sm font-mono shrink-0"
			>
				Private
			</span>
		{:else}
			<span
				class="px-2 py-0.5 text-xs bg-corpse/20 text-corpse border border-corpse/40 rounded-sm font-mono shrink-0"
			>
				Public
			</span>
		{/if}
	</div>

	{#if repo.description}
		<p class="text-xs mb-3 line-clamp-2 font-light {isSupported ? 'text-echo' : 'text-shadow/70'}">
			{repo.description}
		</p>
	{/if}

	<div class="flex items-center gap-3 text-xs font-mono {isSupported ? 'text-shadow' : 'text-shadow/50'}">
		{#if repo.language}
			<span class="flex items-center gap-1.5 {theme.textColor}">
				<span
					class="w-2 h-2 {theme.dotColor} {!isSupported ? 'opacity-50' : ''}"
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
