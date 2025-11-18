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
    let showMobileDoc = $state(false);

    const docpackId = $derived($page.params.id);

    // Extract human-readable symbol name from ID
    function getSymbolName(symbolId: string): string {
        // Format: "prefix/path/file.rs:line:SymbolName"
        const parts = symbolId.split(':');
        return parts[parts.length - 1] || symbolId;
    }

    // Clean up file path for display
    function cleanFilePath(file: string): string {
        // Remove hash prefixes like "xandwr-localdoc-6ed9078/"
        return file.replace(/^[a-z]+-[a-z]+-[a-f0-9]+\//, '');
    }

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
                s.file.toLowerCase().includes(query) ||
                getSymbolName(s.id).toLowerCase().includes(query)
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
        showMobileDoc = true;
    }

    function clearSelection() {
        selectedSymbol = null;
        selectedDoc = null;
        showMobileDoc = false;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }
</script>

<div class="h-full flex flex-col bg-bg-primary text-text-secondary">
    {#if loading}
        <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
                <div class="animate-pulse text-warning text-xl mb-2">Loading docpack...</div>
                <div class="text-sm text-text-secondary/60">Extracting documentation</div>
            </div>
        </div>
    {:else if error}
        <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
                <div class="text-danger text-xl mb-2">Error</div>
                <div class="text-sm text-text-secondary/80">{error}</div>
            </div>
        </div>
    {:else if content}
        <!-- Compact header bar -->
        <div class="shrink-0 border-b border-border-default px-4 py-3">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <h1 class="text-xl font-bold text-text-primary">{content.manifest.project.name}</h1>
                    <span class="text-xs text-text-secondary/60">v{content.manifest.project.version}</span>
                </div>
                <div class="flex items-center gap-4 text-xs text-text-secondary/60">
                    <span>{formatDate(content.manifest.generated_at)}</span>
                    <span class="hidden sm:inline">{content.manifest.stats.symbols_extracted} symbols</span>
                    {#if content.manifest.project.repo}
                        <a href={content.manifest.project.repo} target="_blank" rel="noopener noreferrer"
                           class="text-warning hover:underline hidden md:inline">
                            repo
                        </a>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Search bar -->
        <div class="shrink-0 border-b border-border-default px-4 py-3">
            <div class="flex gap-3">
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="Search symbols..."
                    class="flex-1 bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary placeholder-text-secondary/40 focus:outline-none focus:border-warning"
                />
                <select
                    bind:value={filterKind}
                    class="bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                >
                    <option value="all">All</option>
                    {#each symbolKinds() as kind}
                        <option value={kind}>{kind}</option>
                    {/each}
                </select>
            </div>
        </div>

        <!-- Main content - fills remaining height -->
        <div class="flex-1 flex flex-col lg:flex-row min-h-0">
            <!-- Symbols list -->
            <div class="flex-1 lg:w-1/2 flex flex-col min-h-0 border-r border-border-default {showMobileDoc ? 'hidden lg:flex' : ''}">
                <div class="shrink-0 bg-warning/10 border-b border-border-default px-4 py-2">
                    <h2 class="text-sm font-semibold text-warning">
                        Symbols ({filteredSymbols().length})
                    </h2>
                </div>
                <div class="flex-1 overflow-y-auto">
                    {#each filteredSymbols() as symbol}
                        <button
                            onclick={() => selectSymbol(symbol)}
                            class="w-full text-left px-4 py-3 border-b border-corpse/10 hover:bg-rust/5 transition-colors {selectedSymbol?.id === symbol.id ? 'bg-warning/20 border-l-2 border-l-warning' : ''}"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="font-semibold text-sm text-corpse">{getSymbolName(symbol.id)}</span>
                                        <span class="px-1.5 py-0.5 rounded text-[10px] bg-text-secondary/10 text-text-secondary/70">
                                            {symbol.kind}
                                        </span>
                                    </div>
                                    <div class="text-xs text-text-secondary/50 mt-1 font-mono truncate">
                                        {cleanFilePath(symbol.file)}:{symbol.line}
                                    </div>
                                </div>
                                <svg class="w-4 h-4 text-text-secondary/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    {/each}
                    {#if filteredSymbols().length === 0}
                        <div class="px-4 py-8 text-center text-text-secondary/60">
                            No symbols match your search
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Documentation panel -->
            <div class="flex-1 lg:w-1/2 flex flex-col min-h-0 {!showMobileDoc && !selectedSymbol ? 'hidden lg:flex' : ''} {showMobileDoc ? '' : 'hidden lg:flex'}">
                <div class="shrink-0 bg-warning/10 border-b border-border-default px-4 py-2 flex justify-between items-center">
                    <h2 class="text-sm font-semibold text-warning">Documentation</h2>
                    {#if selectedSymbol}
                        <button
                            onclick={clearSelection}
                            class="text-xs text-text-secondary/60 hover:text-text-secondary flex items-center gap-1"
                        >
                            <svg class="w-3 h-3 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span class="hidden lg:inline">Hide</span>
                            <span class="lg:hidden">Back</span>
                        </button>
                    {/if}
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                    {#if selectedSymbol && selectedDoc}
                        <div class="space-y-4">
                            <!-- Symbol header -->
                            <div>
                                <div class="flex items-center gap-2 mb-2">
                                    <h3 class="text-lg font-semibold text-warning">{getSymbolName(selectedSymbol.id)}</h3>
                                    <span class="px-2 py-0.5 rounded text-xs bg-text-secondary/10 text-text-secondary/70">t-secondary/70">
                                        {selectedSymbol.kind}
                                    </span>
                                </div>
                                <div class="bg-bg-primary border border-border-default rounded-sm p-3 mb-2">
                                    <pre class="text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap">{selectedSymbol.signature}</pre>
                                </div>
                                <div class="text-xs text-text-secondary/50 font-mono">
                                    {cleanFilePath(selectedSymbol.file)}:{selectedSymbol.line}
                                </div>
                            </div>

                            <!-- Summary -->
                            <div>
                                <h4 class="text-sm font-semibold text-text-secondary mb-2">Summary</h4>
                                <p class="text-sm text-text-secondary/80 leading-relaxed">{selectedDoc.summary}</p>
                            </div>

                            <!-- Description -->
                            {#if selectedDoc.description}
                                <div>
                                    <h4 class="text-sm font-semibold text-text-secondary mb-2">Description</h4>
                                    <p class="text-sm text-text-secondary/80 leading-relaxed">{selectedDoc.description}</p>
                                </div>
                            {/if}

                            <!-- Parameters -->
                            {#if selectedDoc.parameters && selectedDoc.parameters.length > 0}
                                <div>
                                    <h4 class="text-sm font-semibold text-text-secondary mb-2">Parameters</h4>
                                    <div class="space-y-2">
                                        {#each selectedDoc.parameters as param}
                                            <div class="bg-bg-primary border border-border-default rounded-sm p-3">
                                                <div class="font-mono text-xs text-warning">{param.name}: {param.type}</div>
                                                <div class="text-xs text-text-secondary/80 mt-1">{param.description}</div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}

                            <!-- Returns -->
                            {#if selectedDoc.returns}
                                <div>
                                    <h4 class="text-sm font-semibold text-text-secondary mb-2">Returns</h4>
                                    <p class="text-sm text-text-secondary/80">{selectedDoc.returns}</p>
                                </div>
                            {/if}

                            <!-- Example -->
                            {#if selectedDoc.example}
                                <div>
                                    <h4 class="text-sm font-semibold text-text-secondary mb-2">Example</h4>
                                    <div class="bg-bg-primary border border-border-default rounded-sm p-3">
                                        <pre class="text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap">{selectedDoc.example}</pre>
                                    </div>
                                </div>
                            {/if}

                            <!-- Notes -->
                            {#if selectedDoc.notes && selectedDoc.notes.length > 0}
                                <div>
                                    <h4 class="text-sm font-semibold text-text-secondary mb-2">Notes</h4>
                                    <ul class="list-disc list-inside space-y-1">
                                        {#each selectedDoc.notes as note}
                                            <li class="text-sm text-text-secondary/80">{note}</li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div class="h-full flex items-center justify-center text-text-secondary/40 text-sm">
                            Select a symbol to view its documentation
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
