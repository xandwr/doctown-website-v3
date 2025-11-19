<script lang="ts">
    import { hasASTSupport, getLanguageStatus, getLanguageTheme } from "$lib/languageSupport";
    import BranchSelector from "./BranchSelector.svelte";

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
        onCreateDocpack: (repo: GitHubRepo, branch: string) => void;
    } = $props();

    // Track selected branch for each repo
    let selectedBranch = $state("main");

    // Reset branch when repo changes
    $effect(() => {
        if (repo) {
            selectedBranch = "main"; // Reset to default when switching repos
        }
    });

    function handleVisitGitHub() {
        if (repo) {
            window.open(repo.html_url, "_blank", "noopener,noreferrer");
            onClose();
        }
    }

    function handleCreateDocpack() {
        if (repo) {
            onCreateDocpack(repo, selectedBranch);
            onClose();
        }
    }

    function handleBranchSelect(branch: string) {
        selectedBranch = branch;
    }

    // Extract owner and repo name from full_name
    const ownerName = $derived(repo ? repo.full_name.split('/')[0] : '');
    const repoName = $derived(repo ? repo.full_name.split('/')[1] : '');

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    // Check if repo has AST support and get theme
    const isSupported = $derived(repo ? hasASTSupport(repo.language) : false);
    const languageStatus = $derived(repo ? getLanguageStatus(repo.language) : null);
    const theme = $derived(repo ? getLanguageTheme(repo.language) : null);
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
            class="bg-concrete border rounded-sm p-2 {!isSupported && repo.language ? 'opacity-70' : ''} {theme && repo.language ? theme.borderColor.replace('/40', '/70') : 'border-corpse/70'}"
        >
            <div class="flex items-start justify-between gap-2 mb-2">
                <h3
                    class="text-base font-bold truncate flex-1 font-mono {isSupported ? 'text-whisper' : 'text-shadow'}"
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
                        private
                    </span>
                {/if}
            </div>
            {#if repo.description}
                <p class="text-xs mb-3 line-clamp-2 font-light {isSupported ? 'text-echo' : 'text-shadow/70'}">
                    {repo.description}
                </p>
            {/if}
            <div
                class="flex items-center gap-3 text-xs font-mono {isSupported ? 'text-shadow' : 'text-shadow/50'}"
            >
                {#if repo.language && theme}
                    <span class="flex items-center gap-1.5 {theme.textColor}">
                        <span class="w-2 h-2 {theme.dotColor} {!isSupported ? 'opacity-50' : ''}"></span>
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
        {#if languageStatus && !languageStatus.supported && repo.language}
            <div class="px-3 py-2 text-xs font-mono text-shadow/70 border-b border-ash bg-static/10">
                <span class="text-rust">!</span> Limited support - {repo.language} has basic docs only
            </div>
        {/if}
        <!-- Branch selector row -->
        <div class="px-3 py-2 border-b border-ash flex items-center justify-between">
            <span class="text-xs font-mono text-shadow">Branch:</span>
            <BranchSelector
                owner={ownerName}
                repo={repoName}
                selectedBranch={selectedBranch}
                onSelect={handleBranchSelect}
            />
        </div>

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
            Generate Docs ({selectedBranch})
        </button>
    </div>
{/if}
