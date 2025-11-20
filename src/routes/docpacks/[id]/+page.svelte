<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import type { DocpackContent, DocpackSymbol, DocpackDocumentation, SymbolEdit, CodeGraph } from "$lib/types";
    import SymbolEditor from "$lib/components/SymbolEditor.svelte";
    import CodeBlock from "$lib/components/CodeBlock.svelte";
    import GraphVisualization from "$lib/components/GraphVisualization.svelte";
    import Prism from "prismjs";
    import "prismjs/components/prism-typescript";
    import "prismjs/components/prism-javascript";
    import "prismjs/components/prism-rust";
    import "prismjs/components/prism-python";

    let loading = $state(true);
    let error = $state<string | null>(null);
    let content = $state<DocpackContent | null>(null);
    let selectedSymbol = $state<DocpackSymbol | null>(null);
    let selectedDoc = $state<DocpackDocumentation | null>(null);
    let searchQuery = $state("");
    let filterKind = $state<string>("all");
    let showMobileDoc = $state(false);
    let showKindFilter = $state(false);
    let selectedKinds = $state<Set<string>>(new Set());
    let editMode = $state(false);
    let edits = $state<Record<string, SymbolEdit>>({});
    let loadingEdits = $state(false);
    let isOwner = $state(false);
    let exporting = $state(false);
    let focusField = $state<string | undefined>(undefined);
    let repoUrl = $state<string | null>(null);
    let commitHash = $state<string | null>(null);

    // Graph visualization state
    let viewMode = $state<"symbols" | "graph">("symbols");
    let graphData = $state<CodeGraph | null>(null);
    let loadingGraph = $state(false);
    let graphError = $state<string | null>(null);

    const docpackId = $derived($page.params.id);
    const hasAnyEdits = $derived(Object.keys(edits).length > 0);

    // Extract human-readable symbol name from ID
    function getSymbolName(symbolId: string): string {
        // Format: "prefix/path/file.rs:line:SymbolName"
        const parts = symbolId.split(':');
        return parts[parts.length - 1] || symbolId;
    }

    // Clean up file path for display
    function cleanFilePath(file: string): string {
        // Remove hash prefixes like "xandwr-doctown-builder-6292c22/"
        // Pattern matches: word-word-...-hexhash/
        return file.replace(/^[\w-]+-[a-f0-9]+\//, '');
    }

    // Get color for symbol kind
    function getKindColor(kind: string): { bg: string; text: string; border: string } {
        const colorMap: Record<string, { bg: string; text: string; border: string }> = {
            'function': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
            'method': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
            'class': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
            'struct': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
            'enum': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
            'interface': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
            'type': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
            'constant': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
            'variable': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
            'property': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
            'module': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
            'trait': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
        };
        return colorMap[kind.toLowerCase()] || { bg: 'bg-text-secondary/10', text: 'text-text-secondary/70', border: 'border-text-secondary/30' };
    }

    // Generate GitHub blob URL for a symbol
    function getGitHubUrl(symbol: DocpackSymbol): string | null {
        if (!repoUrl || !commitHash) {
            return null;
        }
        const filePath = cleanFilePath(symbol.file);
        
        // Handle different GitHub URL formats
        let baseUrl = repoUrl;
        if (baseUrl.endsWith('.git')) {
            baseUrl = baseUrl.slice(0, -4);
        }
        if (!baseUrl.startsWith('http')) {
            return null;
        }
        
        return `${baseUrl}/blob/${commitHash}/${filePath}#L${symbol.line}`;
    }

    // Get inline signature display for functions
    function getInlineSignature(symbol: DocpackSymbol): { html: string; isFunction: boolean } {
        const isFunction = symbol.kind === 'function' || symbol.kind === 'method';
        
        if (!isFunction) {
            return { html: '', isFunction: false };
        }

        // Extract just the parameter list from signature
        const signature = symbol.signature;
        const language = getLanguageFromFile(symbol.file);
        
        try {
            // Highlight the full signature
            const highlighted = Prism.highlight(signature, Prism.languages[language] || Prism.languages.typescript, language);
            return { html: highlighted, isFunction: true };
        } catch (e) {
            return { html: signature, isFunction: true };
        }
    }

    // Detect language from file extension
    function getLanguageFromFile(file: string): string {
        const ext = file.split('.').pop()?.toLowerCase() || '';
        const langMap: Record<string, string> = {
            'rs': 'rust',
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'go': 'go',
            'c': 'c',
            'cpp': 'cpp',
            'cc': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'java': 'java',
            'rb': 'ruby',
            'sh': 'bash',
            'yaml': 'yaml',
            'yml': 'yaml',
            'toml': 'toml',
            'json': 'json',
        };
        return langMap[ext] || 'typescript';
    }

    // Filter symbols based on search and kind
    const filteredSymbols = $derived(() => {
        if (!content) return [];
        let symbols = content.symbols;

        // Filter by selected kinds (if any are selected)
        if (selectedKinds.size > 0) {
            symbols = symbols.filter(s => selectedKinds.has(s.kind));
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

    // Get unique symbol kinds for filtering with counts
    const symbolKinds = $derived(() => {
        if (!content) return [];
        const kindCounts = new Map<string, number>();
        content.symbols.forEach(s => {
            kindCounts.set(s.kind, (kindCounts.get(s.kind) || 0) + 1);
        });
        return Array.from(kindCounts.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([kind, count]) => ({ kind, count }));
    });

    function toggleKind(kind: string) {
        const newSet = new Set(selectedKinds);
        if (newSet.has(kind)) {
            newSet.delete(kind);
        } else {
            newSet.add(kind);
        }
        selectedKinds = newSet;
    }

    function clearKindFilters() {
        selectedKinds = new Set();
    }

    // Merge edits with original symbol and doc data
    const getMergedSymbol = (symbol: DocpackSymbol): DocpackSymbol => {
        const edit = edits[symbol.id];
        if (!edit) return symbol;
        return {
            ...symbol,
            signature: edit.signature ?? symbol.signature,
            kind: edit.kind ?? symbol.kind,
        };
    };

    const getMergedDoc = (doc: DocpackDocumentation, symbolId: string): DocpackDocumentation => {
        const edit = edits[symbolId];
        if (!edit) return doc;
        return {
            ...doc,
            summary: edit.summary ?? doc.summary,
            description: edit.description ?? doc.description,
            parameters: edit.parameters ?? doc.parameters,
            returns: edit.returns ?? doc.returns,
            example: edit.example ?? doc.example,
            notes: edit.notes ?? doc.notes,
        };
    };

    async function loadEdits() {
        if (!$page.data.user) return;
        
        loadingEdits = true;
        try {
            const response = await fetch(`/api/docpacks/${docpackId}/edits`);
            if (response.ok) {
                edits = await response.json();
            }
        } catch (err) {
            console.error("Failed to load edits:", err);
        } finally {
            loadingEdits = false;
        }
    }

    async function saveEdit(editData: any) {
        try {
            const response = await fetch(`/api/docpacks/${docpackId}/edits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save edit");
            }

            const savedEdit = await response.json();
            edits = { ...edits, [savedEdit.symbol_id]: savedEdit };
            
            // Update the displayed content
            if (selectedSymbol) {
                selectedSymbol = getMergedSymbol(selectedSymbol);
                selectedDoc = selectedDoc ? getMergedDoc(selectedDoc, selectedSymbol.id) : null;
            }
            
            editMode = false;
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to save edit");
        }
    }

    async function revertEdit() {
        if (!selectedSymbol) return;
        
        const symbolId = selectedSymbol.id;
        const docId = selectedSymbol.doc_id;
        
        try {
            const response = await fetch(`/api/docpacks/${docpackId}/edits`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symbol_id: symbolId }),
            });

            if (!response.ok) {
                throw new Error("Failed to revert edit");
            }

            const { [symbolId]: _, ...remainingEdits } = edits;
            edits = remainingEdits;
            
            // Refresh the view with original content
            if (content) {
                const originalSymbol = content.symbols.find(s => s.id === symbolId);
                const originalDoc = content.docs[docId];
                if (originalSymbol) selectedSymbol = originalSymbol;
                if (originalDoc) selectedDoc = originalDoc;
            }
            
            editMode = false;
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to revert edit");
        }
    }

    onMount(async () => {
        // Check URL parameter for initial view mode
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const shouldLoadGraph = viewParam === 'graph';
        if (shouldLoadGraph) {
            viewMode = 'graph';
        }

        try {
            const response = await fetch(`/api/docpacks/${docpackId}/content`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to load docpack");
            }
            content = await response.json();

            // Check if user owns this docpack and get repo info
            if ($page.data.user) {
                const docpackResponse = await fetch(`/api/docpacks/${docpackId}`);
                if (docpackResponse.ok) {
                    const docpackData = await docpackResponse.json();
                    isOwner = docpackData.jobs?.user_id === $page.data.user.id;
                    repoUrl = docpackData.repo_url;
                    commitHash = docpackData.commit_hash;
                    if (isOwner) {
                        await loadEdits();
                    }
                }
            } else {
                // Get repo info even for non-authenticated users
                const docpackResponse = await fetch(`/api/docpacks/${docpackId}`);
                if (docpackResponse.ok) {
                    const docpackData = await docpackResponse.json();
                    repoUrl = docpackData.repo_url;
                    commitHash = docpackData.commit_hash;
                }
            }

            // Load graph data if opening in graph view
            if (shouldLoadGraph) {
                await loadGraphData();
            }
        } catch (err) {
            error = err instanceof Error ? err.message : "Failed to load docpack";
        } finally {
            loading = false;
        }
    });

    // Close filter dropdown when clicking outside
    $effect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (showKindFilter && !target.closest('.filter-dropdown-container')) {
                showKindFilter = false;
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });

    function selectSymbol(symbol: DocpackSymbol) {
        const mergedSymbol = getMergedSymbol(symbol);
        const originalDoc = content?.docs[symbol.doc_id] || null;

        selectedSymbol = mergedSymbol;
        selectedDoc = originalDoc ? getMergedDoc(originalDoc, symbol.id) : null;
        showMobileDoc = true;
        editMode = false;
    }

    function toggleEditMode() {
        editMode = !editMode;
        focusField = undefined;
    }

    function startEditingField(field: string) {
        focusField = field;
        editMode = true;
    }

    async function exportWithEdits() {
        if (!hasAnyEdits) return;

        exporting = true;
        try {
            const response = await fetch(`/api/docpacks/${docpackId}/export`, {
                method: "POST",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to export docpack");
            }

            const result = await response.json();

            // Trigger download
            const link = document.createElement("a");
            link.href = result.download_url;
            link.download = `${content?.manifest.project.name}-edited.docpack`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert(`Successfully exported docpack with ${result.edits_applied} edits applied!`);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to export docpack");
        } finally {
            exporting = false;
        }
    }

    async function loadGraphData() {
        if (graphData) return; // Already loaded

        loadingGraph = true;
        graphError = null;

        try {
            const response = await fetch(`/api/docpacks/${docpackId}/graph`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to load graph data");
            }
            graphData = await response.json();
        } catch (err) {
            graphError = err instanceof Error ? err.message : "Failed to load graph data";
            console.error("Graph loading error:", err);
        } finally {
            loadingGraph = false;
        }
    }

    function toggleViewMode() {
        if (viewMode === "symbols") {
            viewMode = "graph";
            loadGraphData(); // Load graph data when switching to graph view
        } else {
            viewMode = "symbols";
        }
    }

    function handleNodeClick(nodeId: string) {
        // Find the symbol that matches the node ID and select it
        const symbol = content?.symbols.find(s => s.id === nodeId);
        if (symbol) {
            viewMode = "symbols"; // Switch back to symbols view
            selectSymbol(symbol);
        }
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

<div class="h-full flex flex-col bg-bg-primary/20 text-text-secondary">
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
        <div class="shrink-0 border-b border-border-default px-4 py-3 bg-bg-primary relative z-20">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <h1 class="text-xl font-bold text-text-primary">{content.manifest.project.name}</h1>
                    <span class="text-xs text-text-secondary/60 font-mono">
                        {content.tracked_branch || 'main'}
                        {#if content.manifest.project.commit}
                            <span class="text-text-tertiary">@</span>{content.manifest.project.commit.substring(0, 7)}
                        {/if}
                    </span>
                    {#if hasAnyEdits}
                        <span class="px-2 py-0.5 rounded text-[10px] bg-warning/20 text-warning">
                            {Object.keys(edits).length} edit{Object.keys(edits).length !== 1 ? 's' : ''}
                        </span>
                    {/if}
                </div>
                <div class="flex items-center gap-4 text-xs text-text-secondary/60">
                    <!-- View Mode Toggle -->
                    <div class="flex items-center gap-1 bg-bg-secondary rounded-sm p-0.5">
                        <button
                            onclick={toggleViewMode}
                            class="px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1.5 {viewMode === 'symbols' ? 'bg-warning text-bg-primary' : 'text-text-secondary hover:text-text-primary'}"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span class="hidden sm:inline">List</span>
                        </button>
                        <button
                            onclick={toggleViewMode}
                            class="px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1.5 {viewMode === 'graph' ? 'bg-warning text-bg-primary' : 'text-text-secondary hover:text-text-primary'}"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span class="hidden sm:inline">Graph</span>
                        </button>
                    </div>

                    {#if isOwner && hasAnyEdits}
                        <button
                            onclick={exportWithEdits}
                            disabled={exporting}
                            class="px-3 py-1.5 bg-warning text-bg-primary hover:bg-warning/90 rounded-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {exporting ? "Exporting..." : "Export Edited"}
                        </button>
                    {/if}
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

        <!-- Search bar (only show in symbols view) -->
        {#if viewMode === "symbols"}
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
        {/if}

        <!-- Main content - fills remaining height -->
        {#if viewMode === "graph"}
            <!-- Graph Visualization View - Full screen overlay -->
            <div class="fixed inset-0 z-10" style="top: var(--navbar-height, 64px);">
                {#if loadingGraph}
                    <div class="h-full flex items-center justify-center bg-gray-900">
                        <div class="text-center">
                            <div class="animate-pulse text-warning text-xl mb-2">Loading graph...</div>
                            <div class="text-sm text-text-secondary/60">Building visualization</div>
                        </div>
                    </div>
                {:else if graphError}
                    <div class="h-full flex items-center justify-center bg-gray-900">
                        <div class="text-center p-8">
                            <div class="text-danger text-xl mb-2">Graph Not Available</div>
                            <div class="text-sm text-text-secondary/80 mb-4">{graphError}</div>
                            <div class="text-xs text-text-secondary/60">
                                This docpack may have been generated before graph support was added.
                            </div>
                        </div>
                    </div>
                {:else if graphData}
                    <GraphVisualization graph={graphData} onNodeClick={handleNodeClick} />
                {/if}
            </div>
        {:else}
            <!-- Symbols List View (existing content) -->
            <div class="flex-1 flex flex-col lg:flex-row min-h-0">
            <!-- Symbols list -->
            <div class="flex-1 lg:w-1/2 flex flex-col min-h-0 border-r border-border-default {showMobileDoc ? 'hidden lg:flex' : ''}">
                <div class="shrink-0 bg-warning/10 border-b border-border-default px-4 py-2">
                    <div class="flex items-center justify-between">
                        <h2 class="text-sm font-semibold text-warning">
                            Symbols ({filteredSymbols().length})
                        </h2>
                        <div class="relative filter-dropdown-container">
                            <button
                                onclick={() => showKindFilter = !showKindFilter}
                                class="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-warning transition-colors rounded-sm hover:bg-warning/10 {selectedKinds.size > 0 ? 'bg-warning/20 text-warning' : ''}"
                            >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                {#if selectedKinds.size > 0}
                                    <span class="font-semibold">{selectedKinds.size}</span>
                                {/if}
                            </button>
                            
                            {#if showKindFilter}
                                <div class="absolute right-0 top-full mt-1 bg-bg-primary border border-border-default rounded-sm shadow-lg z-10 min-w-[200px] filter-dropdown-container">
                                    <div class="px-3 py-2 border-b border-border-default flex items-center justify-between">
                                        <span class="text-xs font-semibold text-text-secondary">Filter by Type</span>
                                        {#if selectedKinds.size > 0}
                                            <button
                                                onclick={clearKindFilters}
                                                class="text-[10px] text-warning hover:underline"
                                            >
                                                Clear
                                            </button>
                                        {/if}
                                    </div>
                                    <div class="max-h-[300px] overflow-y-auto">
                                        {#each symbolKinds() as { kind, count }}
                                            <label class="flex items-center gap-2 px-3 py-2 hover:bg-warning/5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedKinds.has(kind)}
                                                    onchange={() => toggleKind(kind)}
                                                    class="w-3.5 h-3.5 rounded border-border-default text-warning focus:ring-warning focus:ring-offset-0"
                                                />
                                                <span class="flex items-center gap-2 flex-1">
                                                    <span class="w-2 h-2 rounded-full {getKindColor(kind).bg} border {getKindColor(kind).border}"></span>
                                                    <span class="text-xs {getKindColor(kind).text}">{kind}</span>
                                                </span>
                                                <span class="text-[10px] text-text-secondary/50 font-mono">{count}</span>
                                            </label>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto">
                    {#each filteredSymbols() as symbol}
                        <button
                            onclick={() => selectSymbol(symbol)}
                            class="w-full text-left px-4 py-3 border-b border-corpse/10 hover:bg-rust/5 transition-colors {selectedSymbol?.id === symbol.id ? 'bg-warning/20 border-l-2 border-l-warning' : ''}"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="px-1.5 py-0.5 rounded text-[10px] {getKindColor(symbol.kind).bg} {getKindColor(symbol.kind).text} border {getKindColor(symbol.kind).border}">
                                            {symbol.kind}
                                        </span>
                                    </div>
                                    {#if getInlineSignature(symbol).isFunction}
                                        <div class="text-[11px] font-mono leading-snug overflow-hidden signature-display">
                                            {@html getInlineSignature(symbol).html}
                                        </div>
                                    {:else}
                                        <div class="font-semibold text-sm text-corpse">{getSymbolName(symbol.id)}</div>
                                    {/if}
                                    <div class="text-xs text-text-secondary/50 mt-1 font-mono truncate">
                                        {#if getGitHubUrl(symbol)}
                                            <a
                                                href={getGitHubUrl(symbol)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="hover:text-warning hover:underline"
                                                onclick={(e) => e.stopPropagation()}
                                            >
                                                {cleanFilePath(symbol.file)}:{symbol.line}
                                            </a>
                                        {:else}
                                            {cleanFilePath(symbol.file)}:{symbol.line}
                                        {/if}
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
                {#if editMode && selectedSymbol && selectedDoc}
                    <SymbolEditor
                        symbol={selectedSymbol}
                        doc={selectedDoc}
                        onSave={saveEdit}
                        onCancel={toggleEditMode}
                        onRevert={revertEdit}
                        hasEdits={!!edits[selectedSymbol.id]}
                        {focusField}
                    />
                {:else}
                    <div class="shrink-0 bg-warning/10 border-b border-border-default px-4 py-2 flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <h2 class="text-sm font-semibold text-warning">Documentation</h2>
                            {#if selectedSymbol && edits[selectedSymbol.id]}
                                <span class="px-2 py-0.5 rounded text-[10px] bg-warning/20 text-warning">Edited</span>
                            {/if}
                        </div>
                        <div class="flex items-center gap-2">
                            {#if selectedSymbol && isOwner}
                                <button
                                    onclick={toggleEditMode}
                                    class="px-2 py-1 text-xs bg-warning/10 text-warning hover:bg-warning/20 rounded-sm transition-colors flex items-center gap-1"
                                >
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                            {/if}
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
                    </div>
                    <div class="flex-1 overflow-y-auto p-4">
                        {#if selectedSymbol && selectedDoc}
                            <div class="space-y-4">
                                <!-- Symbol header -->
                                <div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <h3 class="text-lg font-semibold text-warning">{getSymbolName(selectedSymbol.id)}</h3>
                                        <span class="px-2 py-0.5 rounded text-xs {getKindColor(selectedSymbol.kind).bg} {getKindColor(selectedSymbol.kind).text} border {getKindColor(selectedSymbol.kind).border}">
                                            {selectedSymbol.kind}
                                        </span>
                                    </div>
                                    <div class="bg-bg-primary border border-border-default rounded-sm p-3 mb-2">
                                        <CodeBlock code={selectedSymbol.signature} language={getLanguageFromFile(selectedSymbol.file)} />
                                    </div>
                                    <div class="text-xs text-text-secondary/50 font-mono">
                                        {#if getGitHubUrl(selectedSymbol)}
                                            <a
                                                href={getGitHubUrl(selectedSymbol)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="hover:text-warning hover:underline inline-flex items-center gap-1"
                                            >
                                                {cleanFilePath(selectedSymbol.file)}:{selectedSymbol.line}
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        {:else}
                                            {cleanFilePath(selectedSymbol.file)}:{selectedSymbol.line}
                                        {/if}
                                    </div>
                                </div>

                            <!-- Summary -->
                            <div>
                                <div class="flex items-center gap-2 mb-2">
                                    <h4 class="text-sm font-semibold text-text-secondary">Summary</h4>
                                    {#if isOwner}
                                        <button
                                            onclick={() => startEditingField('summary')}
                                            class="text-text-secondary/30 hover:text-warning transition-colors"
                                            title="Edit summary"
                                        >
                                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    {/if}
                                </div>
                                <p class="text-sm text-text-secondary/80 leading-relaxed">{selectedDoc.summary}</p>
                            </div>

                            <!-- Description -->
                            {#if selectedDoc.description}
                                <div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <h4 class="text-sm font-semibold text-text-secondary">Description</h4>
                                        {#if isOwner}
                                            <button
                                                onclick={() => startEditingField('description')}
                                                class="text-text-secondary/30 hover:text-warning transition-colors"
                                                title="Edit description"
                                            >
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        {/if}
                                    </div>
                                    <p class="text-sm text-text-secondary/80 leading-relaxed">{selectedDoc.description}</p>
                                </div>
                            {/if}

                            <!-- Parameters -->
                            {#if selectedDoc.parameters && selectedDoc.parameters.length > 0}
                                <div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <h4 class="text-sm font-semibold text-text-secondary">Parameters</h4>
                                        {#if isOwner}
                                            <button
                                                onclick={() => startEditingField('parameters')}
                                                class="text-text-secondary/30 hover:text-warning transition-colors"
                                                title="Edit parameters"
                                            >
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        {/if}
                                    </div>
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
                                    <div class="flex items-center gap-2 mb-2">
                                        <h4 class="text-sm font-semibold text-text-secondary">Returns</h4>
                                        {#if isOwner}
                                            <button
                                                onclick={() => startEditingField('returns')}
                                                class="text-text-secondary/30 hover:text-warning transition-colors"
                                                title="Edit returns"
                                            >
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        {/if}
                                    </div>
                                    <p class="text-sm text-text-secondary/80">{selectedDoc.returns}</p>
                                </div>
                            {/if}

                            <!-- Example -->
                            {#if selectedDoc.example}
                                <div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <h4 class="text-sm font-semibold text-text-secondary">Example</h4>
                                        {#if isOwner}
                                            <button
                                                onclick={() => startEditingField('example')}
                                                class="text-text-secondary/30 hover:text-warning transition-colors"
                                                title="Edit example"
                                            >
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        {/if}
                                    </div>
                                    <div class="bg-bg-primary border border-border-default rounded-sm p-3">
                                        <CodeBlock code={selectedDoc.example} language={getLanguageFromFile(selectedSymbol.file)} />
                                    </div>
                                </div>
                            {/if}

                                <!-- Notes -->
                                {#if selectedDoc.notes && selectedDoc.notes.length > 0}
                                    <div>
                                        <div class="flex items-center gap-2 mb-2">
                                            <h4 class="text-sm font-semibold text-text-secondary">Notes</h4>
                                            {#if isOwner}
                                                <button
                                                    onclick={() => startEditingField('notes')}
                                                    class="text-text-secondary/30 hover:text-warning transition-colors"
                                                    title="Edit notes"
                                                >
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            {/if}
                                        </div>
                                        <ul class="list-disc list-inside space-y-1">
                                            {#each selectedDoc.notes as note}
                                                <li class="text-sm text-text-secondary/80 italic">{note}</li>
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
                {/if}
            </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .signature-display {
        max-height: 3rem;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-clamp: 2;
    }

    /* Ensure syntax highlighting is visible in compact view */
    .signature-display :global(.token.keyword) {
        color: #f472b6;
        font-weight: 500;
    }

    .signature-display :global(.token.function) {
        color: #60a5fa;
        font-weight: 600;
    }

    .signature-display :global(.token.punctuation) {
        color: #9ca3af;
    }

    .signature-display :global(.token.parameter),
    .signature-display :global(.token.property) {
        color: #d1d5db;
    }

    .signature-display :global(.token.class-name),
    .signature-display :global(.token.builtin) {
        color: #10b981;
    }
</style>
