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
    <!-- Liminal backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 backdrop-blur-sm z-50"
        onclick={handleBackdropClick}
        style="background-color: rgba(10, 10, 10, 0.5);"
    ></div>

    <!-- Selected card overlay (outside blur) -->
    <div
        class="absolute z-60 pointer-events-none"
        style="top: {position.top}px; left: {position.left}px; width: {position.width}px;"
    >
        <div
            class="bg-concrete border border-corpse/70 rounded-sm p-2"
        >
            <div class="flex items-start justify-between mb-2">
                <h3
                    class="text-base font-bold text-whisper truncate flex-1 font-mono"
                >
                    {repo.name}
                </h3>
                {#if repo.private}
                    <span
                        class="ml-2 px-2 py-0.5 text-xs bg-static/20 text-shadow border border-static/50 rounded-sm font-mono"
                    >
                        private
                    </span>
                {/if}
            </div>
            {#if repo.description}
                <p class="text-echo text-xs mb-3 line-clamp-2 font-light">
                    {repo.description}
                </p>
            {/if}
            <div
                class="flex items-center gap-3 text-xs text-shadow font-mono"
            >
                {#if repo.language}
                    <span class="flex items-center gap-1.5">
                        <span class="w-2 h-2 bg-corpse"></span>
                        {repo.language}
                    </span>
                {/if}
                {#if repo.stargazers_count > 0}
                    <span class="flex items-center gap-1">
                        <span class="text-rust">★</span>
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
        class="absolute z-60 bg-fog/90 border border-ash rounded-sm animate-in slide-in-from-top-2 duration-200"
        style="top: {position.top -
            8}px; left: {position.left}px; width: {position.width}px; transform: translateY(-100%);"
    >
        <button
            onclick={handleVisitGitHub}
            class="w-full text-left px-3 py-2 hover:bg-ash text-corpse hover:text-whisper font-mono text-xs transition-all border-b border-ash"
        >
            Visit on GitHub
        </button>

        <button
            onclick={handleCreateDocpack}
            class="w-full text-left px-3 py-2 hover:bg-ash text-corpse hover:text-whisper font-mono text-xs transition-all"
        >
            Generate Docs
        </button>
    </div>
{/if}
