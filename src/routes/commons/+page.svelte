<script lang="ts">
    import DocpackCard from "$lib/components/DocpackCard.svelte";
    import DocpackConfigModal from "$lib/components/DocpackConfigModal.svelte";

    interface Docpack {
        id: string;
        name: string;
        full_name: string;
        description?: string;
        updated_at: string;
        status: "pending" | "valid" | "public" | "failed";
        repo_url: string;
        commit_hash?: string;
        version?: string;
    }

    // Mock data for now - will be replaced with actual S3 bucket data
    let publicDocpacks = $state<Docpack[]>([
        {
            id: "1",
            name: "example-docs",
            full_name: "user/example-docs",
            description: "Example public docpack for demonstration",
            updated_at: new Date().toISOString(),
            status: "public",
            repo_url: "https://github.com/user/example-docs",
            commit_hash: "abc123def456",
            version: "1.0.0",
        },
    ]);

    let selectedDocpack = $state<Docpack | null>(null);
    let modalPosition = $state<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    function openConfigModal(docpack: Docpack, event: MouseEvent) {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        modalPosition = {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
        };
        selectedDocpack = docpack;
    }

    function closeModal() {
        selectedDocpack = null;
        modalPosition = null;
    }

    function handleStatusUpdate(
        docpack: Docpack,
        newStatus: "pending" | "valid" | "public" | "failed",
    ) {
        // Placeholder - will be replaced with actual API call
        console.log(`Updating ${docpack.name} to status: ${newStatus}`);
        closeModal();
    }
</script>

<div class="h-full p-8 overflow-y-auto">
    <div class="max-w-7xl mx-auto">
        <div class="mb-8">
            <h1 class="text-4xl font-bold tracking-tight mb-2">Commons</h1>
            <p class="text-white/60 text-sm">
                Public documentation packages available globally for all users
            </p>
            <p class="text-white/40 text-xs mt-1 font-mono">
                // Like npm or cargo, but for documentation
            </p>
        </div>

        <div class="flex items-baseline gap-3 mb-6">
            <h2 class="text-2xl font-bold tracking-tight">public docpacks</h2>
            <span class="text-sm text-cyan-400 font-mono">
                // {publicDocpacks.length}
                {publicDocpacks.length === 1 ? "pack" : "packs"}
            </span>
        </div>

        {#if publicDocpacks.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each publicDocpacks as docpack (docpack.id)}
                    <button
                        onclick={(e) => openConfigModal(docpack, e)}
                        class="text-left"
                    >
                        <DocpackCard {docpack} />
                    </button>
                {/each}
            </div>
        {:else}
            <div
                class="bg-black/30 border border-cyan-500/20 rounded-lg p-12 text-center"
            >
                <div class="text-6xl mb-4">📚</div>
                <p class="text-cyan-400/80 font-mono text-sm mb-2">
                    no public docpacks yet
                </p>
                <p class="text-white/40 text-xs">
                    be the first to publish documentation to the commons
                </p>
            </div>
        {/if}
    </div>
</div>

<DocpackConfigModal
    docpack={selectedDocpack}
    position={modalPosition}
    onClose={closeModal}
    onStatusUpdate={handleStatusUpdate}
/>
