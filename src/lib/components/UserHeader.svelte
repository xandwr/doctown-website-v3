<script lang="ts">
	import type { User } from "$lib/supabase";

	let { user }: { user: User } = $props();
</script>

<div class="flex items-center gap-4 mb-10">
	<img
		src={user.avatar_url || ''}
		alt={user.github_login}
		class="w-16 h-16 rounded-full ring-2 ring-emerald-500/30"
	/>
	<div>
		<h1 class="text-3xl font-bold tracking-tight">
			{user.name || user.github_login}
		</h1>
		<p class="text-emerald-400/70 font-mono text-sm">@{user.github_login}</p>
	</div>
</div>
