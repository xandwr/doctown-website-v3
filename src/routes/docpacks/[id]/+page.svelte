<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import type { DocpackContent, DocpackSymbol, DocpackDocumentation } from "$lib/types";

    let loading = $state(true);
    let error = $state<string | null>(null);
    let content = $state<DocpackContent | null>(null);
    let selectedSymbol = $state<DocpackSymbol | null>(null);
    let selectedDoc = $state<DocpackDocumentation | null>(null);
    let searchQuery = $state("");
    let filterKind = $state<string>("all");

    const docpackId = $derived($page.params.id);

    // Filter symbols based on search and kind
    const filteredSymbols = $derived(() => {
        if (!content) return [];
        let symbols = content.symbols;
        
        // Filter by kind
        if (filterKind !== "all") {
            symbols = symbols.filter(s => s.kind === filterKind);
        }
        
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            symbols = symbols.filter(s => 
                s.id.toLowerCase().includes(query) ||
                s.signature.toLowerCase().includes(query) ||
                s.file.toLowerCase().includes(query)
            );
        }
        
        return symbols;
    });

    // Get unique symbol kinds for filtering
    const symbolKinds = $derived(() => {
        if (!content) return [];
        const kinds = new Set(content.symbols.map(s => s.kind));
        return Array.from(kinds).sort();
    });

    onMount(async () => {
        try {
            const response = await fetch(`/api/docpacks/${docpackId}/content`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to load docpack");
            }
            content = await response.json();
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to load docpack";
        } finally {
            loading = false;
        }
    });

    function selectSymbol(symbol: DocpackSymbol) {
        selectedSymbol = symbol;
        selectedDoc = content?.docs[symbol.doc_id] || null;
    }

    function clearSelection() {
        selectedSymbol = null;
        selectedDoc = null;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
</script>

<div class="min-h-screen bg-black text-corpse">
    {#if loading}
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="animate-pulse text-rust text-xl mb-2">Loading docpack...</div>
                <div class="text-sm text-corpse/60">Extracting documentation</div>
            </div>
        </div>
    {:else if error}
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="text-decay text-xl mb-2">Error</div>
                <div class="text-sm text-corpse/80">{error}</div>
            </div>
        </div>
    {:else if content}
        <div class="max-w-7xl mx-auto p-6">
            <!-- Header with manifest info -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-rust mb-2">{content.manifest.project.name}</h1>
                <div class="text-sm text-corpse/60 space-y-1">
                    <div>Version: {content.manifest.project.version}</div>
                    <div>Commit: <span class="font-mono">{content.manifest.project.commit.substring(0, 8)}</span></div>
                    <div>Generated: {formatDate(content.manifest.generated_at)}</div>
                    <div>
                        Repository: 
                        <a href={content.manifest.project.repo} target="_blank" rel="noopener noreferrer" 
                           class="text-rust hover:underline">
                            {content.manifest.project.repo}
                        </a>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-rust/10 border border-rust/20 rounded p-4">
                    <div class="text-2xl font-bold text-rust">{content.manifest.stats.symbols_extracted}</div>
                    <div class="text-xs text-corpse/60">Symbols</div>
                </div>
                <div class="bg-rust/10 border border-rust/20 rounded p-4">
                    <div class="text-2xl font-bold text-rust">{content.manifest.stats.docs_generated}</div>
                    <div class="text-xs text-corpse/60">Docs Generated</div>
                </div>
                {#each Object.entries(content.manifest.language_summary) as [lang, count]}
                    <div class="bg-corpse/10 border border-corpse/20 rounded p-4">
                        <div class="text-2xl font-bold text-corpse">{count}</div>
                        <div class="text-xs text-corpse/60 capitalize">{lang.replace('_files', '')}</div>
                    </div>
                {/each}
            </div>

            <!-- Search and filter bar -->
            <div class="mb-6 flex gap-4 flex-wrap">
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search symbols..."
                    class="flex-1 min-w-[200px] bg-black border border-corpse/20 rounded px-4 py-2 text-corpse placeholder-corpse/40 focus:outline-none focus:border-rust"
                />
                <select
                    bind:value={filterKind}
                    class="bg-black border border-corpse/20 rounded px-4 py-2 text-corpse focus:outline-none focus:border-rust"
                >
                    <option value="all">All Types</option>
                    {#each symbolKinds() as kind}
                        <option value={kind}>{kind}</option>
                    {/each}
                </select>
            </div>

            <!-- Main content area -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Symbols list -->
                <div class="border border-corpse/20 rounded-lg overflow-hidden">
                    <div class="bg-rust/10 border-b border-corpse/20 px-4 py-3">
                        <h2 class="text-lg font-semibold text-rust">
                            Symbols ({filteredSymbols().length})
                        </h2>
                    </div>
                    <div class="overflow-y-auto max-h-[600px]">
                        {#each filteredSymbols() as symbol}
                            <button
                                onclick={() => selectSymbol(symbol)}
                                class="w-full text-left px-4 py-3 border-b border-corpse/10 hover:bg-rust/5 transition-colors {selectedSymbol?.id === symbol.id ? 'bg-rust/10' : ''}"
                            >
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <div class="font-mono text-sm text-corpse truncate">{symbol.id}</div>
                                        <div class="text-xs text-corpse/60 mt-1">{symbol.file}:{symbol.line}</div>
                                    </div>
                                    <span class="px-2 py-1 rounded text-xs bg-corpse/10 text-corpse shrink-0">
                                        {symbol.kind}
                                    </span>
                                </div>
                            </button>
                        {/each}
                        {#if filteredSymbols().length === 0}
                            <div class="px-4 py-8 text-center text-corpse/60">
                                No symbols match your search
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Documentation panel -->
                <div class="border border-corpse/20 rounded-lg overflow-hidden">
                    <div class="bg-rust/10 border-b border-corpse/20 px-4 py-3 flex justify-between items-center">
                        <h2 class="text-lg font-semibold text-rust">Documentation</h2>
                        {#if selectedSymbol}
                            <button
                                onclick={clearSelection}
                                class="text-xs text-corpse/60 hover:text-corpse"
                            >
                                Clear
                            </button>
                        {/if}
                    </div>
                    <div class="overflow-y-auto max-h-[600px] p-4">
                        {#if selectedSymbol && selectedDoc}
                            <div class="space-y-4">
                                <!-- Symbol header -->
                                <div>
                                    <h3 class="text-lg font-semibold text-rust mb-2">{selectedSymbol.id}</h3>
                                    <div class="bg-black border border-corpse/20 rounded p-3 mb-2">
                                        <pre class="text-xs text-corpse overflow-x-auto">{selectedSymbol.signature}</pre>
                                    </div>
                                    <div class="text-xs text-corpse/60">
                                        {selectedSymbol.file}:{selectedSymbol.line}
                                    </div>
                                </div>

                                <!-- Summary -->
                                <div>
                                    <h4 class="text-sm font-semibold text-corpse mb-2">Summary</h4>
                                    <p class="text-sm text-corpse/80">{selectedDoc.summary}</p>
                                </div>

                                <!-- Description -->
                                {#if selectedDoc.description}
                                    <div>
                                        <h4 class="text-sm font-semibold text-corpse mb-2">Description</h4>
                                        <p class="text-sm text-corpse/80">{selectedDoc.description}</p>
                                    </div>
                                {/if}

                                <!-- Parameters -->
                                {#if selectedDoc.parameters && selectedDoc.parameters.length > 0}
                                    <div>
                                        <h4 class="text-sm font-semibold text-corpse mb-2">Parameters</h4>
                                        <div class="space-y-2">
                                            {#each selectedDoc.parameters as param}
                                                <div class="bg-black border border-corpse/20 rounded p-3">
                                                    <div class="font-mono text-xs text-rust">{param.name}: {param.type}</div>
                                                    <div class="text-xs text-corpse/80 mt-1">{param.description}</div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}

                                <!-- Returns -->
                                {#if selectedDoc.returns}
                                    <div>
                                        <h4 class="text-sm font-semibold text-corpse mb-2">Returns</h4>
                                        <p class="text-sm text-corpse/80">{selectedDoc.returns}</p>
                                    </div>
                                {/if}

                                <!-- Example -->
                                {#if selectedDoc.example}
                                    <div>
                                        <h4 class="text-sm font-semibold text-corpse mb-2">Example</h4>
                                        <div class="bg-black border border-corpse/20 rounded p-3">
                                            <pre class="text-xs text-corpse overflow-x-auto">{selectedDoc.example}</pre>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Notes -->
                                {#if selectedDoc.notes && selectedDoc.notes.length > 0}
                                    <div>
                                        <h4 class="text-sm font-semibold text-corpse mb-2">Notes</h4>
                                        <ul class="list-disc list-inside space-y-1">
                                            {#each selectedDoc.notes as note}
                                                <li class="text-sm text-corpse/80">{note}</li>
                                            {/each}
                                        </ul>
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <div class="flex items-center justify-center h-full text-corpse/60">
                                Select a symbol to view its documentation
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
