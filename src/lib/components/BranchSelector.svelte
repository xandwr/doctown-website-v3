<script lang="ts">
    import type { BranchInfo } from "$lib/types";

    interface Props {
        owner: string;
        repo: string;
        selectedBranch: string;
        onSelect: (branch: string) => void;
    }

    let { owner, repo, selectedBranch, onSelect }: Props = $props();

    let branches = $state<BranchInfo[]>([]);
    let loading = $state(false);
    let error = $state<string | null>(null);
    let isOpen = $state(false);

    async function fetchBranches() {
        if (branches.length > 0) return; // Already fetched

        loading = true;
        error = null;

        try {
            const response = await fetch(`/api/repos/${owner}/${repo}/branches`);
            if (!response.ok) {
                throw new Error(`Failed to fetch branches: ${response.status}`);
            }
            const data = await response.json();
            branches = data.branches;

            // If no branch selected yet, select the default
            if (!selectedBranch && branches.length > 0) {
                const defaultBranch = branches.find(b => b.is_default);
                if (defaultBranch) {
                    onSelect(defaultBranch.name);
                }
            }
        } catch (e) {
            error = e instanceof Error ? e.message : "Failed to fetch branches";
        } finally {
            loading = false;
        }
    }

    function handleToggle() {
        if (!isOpen) {
            fetchBranches();
        }
        isOpen = !isOpen;
    }

    function handleSelect(branchName: string) {
        onSelect(branchName);
        isOpen = false;
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.branch-selector')) {
            isOpen = false;
        }
    }

    // Close on escape
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && isOpen) {
            isOpen = false;
        }
    }
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="branch-selector relative">
    <button
        onclick={handleToggle}
        class="flex items-center gap-1.5 px-2 py-1 text-xs font-mono bg-ash/50 hover:bg-ash border border-corpse/30 rounded-sm transition-colors"
    >
        <svg
            class="w-3 h-3 text-corpse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l-7 7 7 7M15 5l7 7-7 7"
                transform="rotate(90 12 12)"
            />
        </svg>
        <span class="text-echo">{selectedBranch || 'main'}</span>
        <svg
            class="w-3 h-3 text-shadow transition-transform {isOpen ? 'rotate-180' : ''}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    </button>

    {#if isOpen}
        <div
            class="absolute top-full left-0 mt-1 w-48 bg-fog border border-ash rounded-sm shadow-lg z-50 max-h-64 overflow-y-auto"
        >
            {#if loading}
                <div class="px-3 py-2 text-xs text-shadow font-mono">Loading branches...</div>
            {:else if error}
                <div class="px-3 py-2 text-xs text-rust font-mono">{error}</div>
            {:else if branches.length === 0}
                <div class="px-3 py-2 text-xs text-shadow font-mono">No branches found</div>
            {:else}
                {#each branches as branch}
                    <button
                        onclick={() => handleSelect(branch.name)}
                        class="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-ash transition-colors flex items-center gap-2
                            {branch.name === selectedBranch ? 'bg-ash/50 text-whisper' : 'text-echo'}"
                    >
                        <span class="truncate flex-1">{branch.name}</span>
                        {#if branch.is_default}
                            <span class="text-[10px] text-shadow px-1 bg-static/20 rounded">default</span>
                        {/if}
                        {#if branch.protected}
                            <span class="text-[10px] text-rust" title="Protected branch">🔒</span>
                        {/if}
                    </button>
                {/each}
            {/if}
        </div>
    {/if}
</div>
