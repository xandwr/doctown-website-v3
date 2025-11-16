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
        position,
        onClose,
        onCreateDocpack,
    }: {
        repo: GitHubRepo | null;
        position: { top: number; left: number; width: number } | null;
        onClose: () => void;
        onCreateDocpack: (repo: GitHubRepo) => void;
    } = $props();

    function handleVisitGitHub() {
        if (repo) {
            window.open(repo.html_url, "_blank", "noopener,noreferrer");
            onClose();
        }
    }

    function handleCreateDocpack() {
        if (repo) {
            onCreateDocpack(repo);
            onClose();
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }
</script>

{#if repo && position}
    <!-- Blur backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 backdrop-blur-xs z-50"
        onclick={handleBackdropClick}
        style="background-color: rgba(0, 0, 0, 0.15);"
    ></div>

    <!-- Selected card overlay (outside blur) -->
    <div
        class="absolute z-60 pointer-events-none"
        style="top: {position.top}px; left: {position.left}px; width: {position.width}px;"
    >
        <div
            class="bg-black border-2 border-cyan-500/70 rounded p-2 shadow-lg shadow-cyan-500/20"
        >
            <div class="flex items-start justify-between mb-2">
                <h3
                    class="text-base font-bold text-white truncate flex-1 font-mono"
                >
                    {repo.name}
                </h3>
                {#if repo.private}
                    <span
                        class="ml-2 px-2 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded font-mono"
                    >
                        private
                    </span>
                {/if}
            </div>
            {#if repo.description}
                <p class="text-white/50 text-xs mb-3 line-clamp-2 font-light">
                    {repo.description}
                </p>
            {/if}
            <div
                class="flex items-center gap-3 text-xs text-white/40 font-mono"
            >
                {#if repo.language}
                    <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
                        {repo.language}
                    </span>
                {/if}
                {#if repo.stargazers_count > 0}
                    <span class="flex items-center gap-1">
                        <span class="text-yellow-500">★</span>
                        {repo.stargazers_count}
                    </span>
                {/if}
                <span class="ml-auto"
                    >{new Date(repo.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}</span
                >
            </div>
        </div>
    </div>

    <!-- Dropdown menu -->
    <div
        class="absolute z-60 bg-zinc-900/50 border border-white/20 rounded shadow-2xl animate-in slide-in-from-top-2 duration-200"
        style="top: {position.top -
            8}px; left: {position.left}px; width: {position.width}px; transform: translateY(-100%);"
    >
        <button
            onclick={handleVisitGitHub}
            class="w-full text-left px-3 py-2 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 font-mono text-xs transition-all border-b border-white/10"
        >
            Visit on GitHub
        </button>

        <button
            onclick={handleCreateDocpack}
            class="w-full text-left px-3 py-2 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 font-mono text-xs transition-all rounded-b"
        >
            Generate Docs
        </button>
    </div>
{/if}
