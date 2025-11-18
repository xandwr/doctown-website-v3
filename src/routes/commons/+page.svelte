<script lang="ts">
    import DocpackCard from "$lib/components/DocpackCard.svelte";
    import DocpackConfigModal from "$lib/components/DocpackConfigModal.svelte";

    interface Docpack {
        id: string;
        name: string;
        full_name: string;
        description?: string;
        updated_at: string;
        status: "pending" | "valid" | "public" | "failed" | "building";
        repo_url: string;
        commit_hash?: string;
        version?: string;
        file_url: string | null;
    }

    let publicDocpacks = $state<Docpack[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);

    let selectedDocpack = $state<Docpack | null>(null);
    let modalPosition = $state<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    // Fetch public docpacks on mount
    $effect(() => {
        async function fetchPublicDocpacks() {
            try {
                isLoading = true;
                error = null;
                const response = await fetch('/api/docpacks?public=true');

                if (!response.ok) {
                    throw new Error('Failed to fetch public docpacks');
                }

                const data = await response.json();
                publicDocpacks = data.docpacks || [];
            } catch (err) {
                console.error('Error fetching public docpacks:', err);
                error = err instanceof Error ? err.message : 'Failed to load docpacks';
            } finally {
                isLoading = false;
            }
        }

        fetchPublicDocpacks();
    });

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

    async function handleStatusUpdate(
        docpack: Docpack,
        newStatus: "pending" | "valid" | "public" | "failed" | "building",
    ) {
        try {
            // Determine the public value based on the new status
            const isPublic = newStatus === 'public';

            // Call the API to update the docpack
            const response = await fetch(`/api/docpacks/${docpack.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ public: isPublic }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Failed to update docpack:', error);
                alert('Failed to update docpack: ' + (error.error || 'Unknown error'));
                return;
            }

            console.log(`Successfully updated ${docpack.name} to status: ${newStatus}`);

            // Remove from commons if unpublished
            if (!isPublic) {
                publicDocpacks = publicDocpacks.filter(d => d.id !== docpack.id);
            }

            closeModal();
        } catch (error) {
            console.error('Error updating docpack:', error);
            alert('Failed to update docpack');
        }
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

        {#if isLoading}
            <div class="bg-black/30 border border-info/20 rounded-md p-12 text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-info mb-4"></div>
                <p class="text-info/80 font-mono text-sm">
                    loading public docpacks...
                </p>
            </div>
        {:else if error}
            <div class="bg-black/30 border border-status-invalid/20 rounded-md p-12 text-center">
                <div class="text-6xl mb-4">⚠️</div>
                <p class="text-status-invalid/80 font-mono text-sm mb-2">
                    {error}
                </p>
                <p class="text-white/40 text-xs">
                    please try again later
                </p>
            </div>
        {:else if publicDocpacks.length > 0}
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
                class="bg-black/30 border border-cyan-500/20 rounded-md p-12 text-center"
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
