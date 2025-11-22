<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import type {
        DocpackContent,
        BuilderGraphNode,
        SymbolDoc,
        SymbolEdit,
        VisualizationGraph,
        GraphNodeKind
    } from "$lib/types";
    import {
        getNodeName,
        getNodeKindString,
        isNodePublic
    } from "$lib/types";
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
    let selectedNodeId = $state<string | null>(null);
    let searchQuery = $state("");
    let showMobileDoc = $state(false);
    let showKindFilter = $state(false);
    let selectedKinds = $state<Set<string>>(new Set());
    let editMode = $state(false);
    let edits = $state<Record<string, SymbolEdit>>({});
    let loadingEdits = $state(false);
    let isOwner = $state(false);
    let exporting = $state(false);
    let repoUrl = $state<string | null>(null);
    let commitHash = $state<string | null>(null);

    // Graph visualization state
    let viewMode = $state<"symbols" | "graph">("symbols");
    let graphData = $state<VisualizationGraph | null>(null);
    let loadingGraph = $state(false);
    let graphError = $state<string | null>(null);

    const docpackId = $derived($page.params.id);
    const hasAnyEdits = $derived(Object.keys(edits).length > 0);

    // Get selected node and its documentation
    const selectedNode = $derived(() => {
        if (!content || !selectedNodeId) return null;
        return content.graph.nodes[selectedNodeId] || null;
    });

    const selectedDoc = $derived(() => {
        if (!content || !selectedNodeId) return null;
        return content.documentation.symbol_summaries[selectedNodeId] || null;
    });

    // Get all nodes as array for display
    const allNodes = $derived(() => {
        if (!content) return [];
        return Object.values(content.graph.nodes);
    });

    // Clean up file path for display
    function cleanFilePath(file: string): string {
        // Remove hash prefixes like "xandwr-doctown-builder-6292c22/"
        return file.replace(/^[\w-]+-[a-f0-9]+\//, '');
    }

    // Get color for node kind
    function getKindColor(kind: string): { bg: string; text: string; border: string } {
        const colorMap: Record<string, { bg: string; text: string; border: string }> = {
            'function': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
            'type': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
            'trait': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
            'module': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
            'constant': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
            'file': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
            'cluster': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
            'package': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
            'macro': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
        };
        return colorMap[kind.toLowerCase()] || { bg: 'bg-text-secondary/10', text: 'text-text-secondary/70', border: 'border-text-secondary/30' };
    }

    // Generate GitHub blob URL for a node
    function getGitHubUrl(node: BuilderGraphNode): string | null {
        if (!repoUrl || !commitHash) return null;
        const filePath = cleanFilePath(node.location.file);

        let baseUrl = repoUrl;
        if (baseUrl.endsWith('.git')) {
            baseUrl = baseUrl.slice(0, -4);
        }
        if (!baseUrl.startsWith('http')) {
            return null;
        }

        return `${baseUrl}/blob/${commitHash}/${filePath}#L${node.location.start_line}`;
    }

    // Get signature for function nodes
    function getSignature(node: BuilderGraphNode): string | null {
        if ('Function' in node.kind) {
            return node.kind.Function.signature;
        }
        return null;
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
            'java': 'java',
        };
        return langMap[ext] || 'typescript';
    }

    // Filter nodes based on search and kind
    const filteredNodes = $derived(() => {
        if (!content) return [];
        let nodes = Object.values(content.graph.nodes);

        // Filter out file and cluster nodes by default for cleaner view
        nodes = nodes.filter(n => {
            const kind = getNodeKindString(n.kind);
            return kind !== 'file';
        });

        // Filter by selected kinds (if any are selected)
        if (selectedKinds.size > 0) {
            nodes = nodes.filter(n => selectedKinds.has(getNodeKindString(n.kind)));
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            nodes = nodes.filter(n =>
                n.id.toLowerCase().includes(query) ||
                getNodeName(n.kind).toLowerCase().includes(query) ||
                n.location.file.toLowerCase().includes(query)
            );
        }

        // Sort by importance (fan_in + complexity)
        nodes.sort((a, b) => {
            const aScore = (a.metadata.fan_in * 2) + (a.metadata.complexity || 0);
            const bScore = (b.metadata.fan_in * 2) + (b.metadata.complexity || 0);
            return bScore - aScore;
        });

        return nodes;
    });

    // Get unique node kinds for filtering with counts
    const nodeKinds = $derived(() => {
        if (!content) return [];
        const kindCounts = new Map<string, number>();
        Object.values(content.graph.nodes).forEach(n => {
            const kind = getNodeKindString(n.kind);
            if (kind !== 'file') { // Don't show file in filter
                kindCounts.set(kind, (kindCounts.get(kind) || 0) + 1);
            }
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
                }
            } else {
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

    function selectNode(nodeId: string) {
        selectedNodeId = nodeId;
        showMobileDoc = true;
        editMode = false;
    }

    async function loadGraphData() {
        if (graphData) return;

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
            loadGraphData();
        } else {
            viewMode = "symbols";
        }
    }

    function handleNodeClick(nodeId: string) {
        viewMode = "symbols";
        selectNode(nodeId);
    }

    function clearSelection() {
        selectedNodeId = null;
        showMobileDoc = false;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    // Get repo name from metadata
    function getRepoName(): string {
        if (content?.graph.metadata.repository_name) {
            return content.graph.metadata.repository_name;
        }
        // Extract from metadata source
        if (content?.metadata.source) {
            const parts = content.metadata.source.split('/');
            return parts[parts.length - 1]?.replace('.git', '') || 'Unknown';
        }
        return 'Unknown';
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
                    <h1 class="text-xl font-bold text-text-primary">{getRepoName()}</h1>
                    <span class="text-xs text-text-secondary/60 font-mono">
                        {content.tracked_branch || 'main'}
                    </span>
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

                    <span>{formatDate(content.metadata.generated_at)}</span>
                    <span class="hidden sm:inline">{content.graph.metadata.total_symbols} symbols</span>
                    <span class="hidden md:inline">{content.graph.metadata.languages.join(', ')}</span>
                </div>
            </div>
        </div>

        <!-- Architecture Overview Banner -->
        {#if content.documentation.architecture_overview}
            <div class="shrink-0 border-b border-border-default px-4 py-3 bg-emerald-500/5">
                <div class="text-sm text-emerald-400 font-semibold mb-1">Architecture Overview</div>
                <p class="text-xs text-text-secondary/80 leading-relaxed">{content.documentation.architecture_overview.overview}</p>
            </div>
        {/if}

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
                    <div class="relative filter-dropdown-container">
                        <button
                            onclick={() => showKindFilter = !showKindFilter}
                            class="flex items-center gap-1.5 px-3 py-2 text-sm border border-border-default rounded-sm bg-bg-primary hover:bg-warning/10 {selectedKinds.size > 0 ? 'bg-warning/20 text-warning border-warning' : 'text-text-secondary'}"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {#if selectedKinds.size > 0}
                                <span class="font-semibold">{selectedKinds.size}</span>
                            {:else}
                                <span>Filter</span>
                            {/if}
                        </button>

                        {#if showKindFilter}
                            <div class="absolute right-0 top-full mt-1 bg-bg-primary border border-border-default rounded-sm shadow-lg z-10 min-w-[200px]">
                                <div class="px-3 py-2 border-b border-border-default flex items-center justify-between">
                                    <span class="text-xs font-semibold text-text-secondary">Filter by Type</span>
                                    {#if selectedKinds.size > 0}
                                        <button onclick={clearKindFilters} class="text-[10px] text-warning hover:underline">
                                            Clear
                                        </button>
                                    {/if}
                                </div>
                                <div class="max-h-[300px] overflow-y-auto">
                                    {#each nodeKinds() as { kind, count }}
                                        <label class="flex items-center gap-2 px-3 py-2 hover:bg-warning/5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedKinds.has(kind)}
                                                onchange={() => toggleKind(kind)}
                                                class="w-3.5 h-3.5 rounded border-border-default text-warning focus:ring-warning"
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
        {/if}

        <!-- Main content -->
        {#if viewMode === "graph"}
            <!-- Graph Visualization View -->
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
                        </div>
                    </div>
                {:else if graphData}
                    <GraphVisualization graph={graphData} onNodeClick={handleNodeClick} />
                {/if}
            </div>
        {:else}
            <!-- Symbols List View -->
            <div class="flex-1 flex flex-col lg:flex-row min-h-0">
                <!-- Symbols list -->
                <div class="flex-1 lg:w-1/2 flex flex-col min-h-0 border-r border-border-default {showMobileDoc ? 'hidden lg:flex' : ''}">
                    <div class="shrink-0 bg-warning/10 border-b border-border-default px-4 py-2">
                        <h2 class="text-sm font-semibold text-warning">
                            Symbols ({filteredNodes().length})
                        </h2>
                    </div>
                    <div class="flex-1 overflow-y-auto">
                        {#each filteredNodes() as node}
                            {@const kindStr = getNodeKindString(node.kind)}
                            {@const nodeName = getNodeName(node.kind)}
                            {@const signature = getSignature(node)}
                            <button
                                onclick={() => selectNode(node.id)}
                                class="w-full text-left px-4 py-3 border-b border-corpse/10 hover:bg-rust/5 transition-colors {selectedNodeId === node.id ? 'bg-warning/20 border-l-2 border-l-warning' : ''}"
                            >
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="px-1.5 py-0.5 rounded text-[10px] {getKindColor(kindStr).bg} {getKindColor(kindStr).text} border {getKindColor(kindStr).border}">
                                                {kindStr}
                                            </span>
                                            {#if node.metadata.is_public_api}
                                                <span class="px-1 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    pub
                                                </span>
                                            {/if}
                                            {#if node.metadata.complexity && node.metadata.complexity > 10}
                                                <span class="px-1 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                    complexity: {node.metadata.complexity}
                                                </span>
                                            {/if}
                                        </div>
                                        <div class="font-semibold text-sm text-corpse">{nodeName}</div>
                                        {#if signature}
                                            <div class="text-[11px] font-mono text-text-secondary/60 mt-1 truncate">
                                                {signature}
                                            </div>
                                        {/if}
                                        <div class="text-xs text-text-secondary/50 mt-1 font-mono truncate">
                                            {cleanFilePath(node.location.file)}:{node.location.start_line}
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-end gap-1 text-[10px] text-text-secondary/50">
                                        {#if node.metadata.fan_in > 0}
                                            <span>fan-in: {node.metadata.fan_in}</span>
                                        {/if}
                                        {#if node.metadata.fan_out > 0}
                                            <span>fan-out: {node.metadata.fan_out}</span>
                                        {/if}
                                    </div>
                                </div>
                            </button>
                        {/each}
                        {#if filteredNodes().length === 0}
                            <div class="px-4 py-8 text-center text-text-secondary/60">
                                No symbols match your search
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Documentation panel -->
                <div class="flex-1 lg:w-1/2 flex flex-col min-h-0 {!showMobileDoc && !selectedNodeId ? 'hidden lg:flex' : ''} {showMobileDoc ? '' : 'hidden lg:flex'}">
                    <div class="shrink-0 bg-warning/10 border-b border-border-default px-4 py-2 flex justify-between items-center">
                        <h2 class="text-sm font-semibold text-warning">Documentation</h2>
                        {#if selectedNodeId}
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
                        {#if selectedNode() && selectedNodeId}
                            {@const node = selectedNode()!}
                            {@const doc = selectedDoc()}
                            {@const kindStr = getNodeKindString(node.kind)}
                            {@const nodeName = getNodeName(node.kind)}
                            {@const signature = getSignature(node)}
                            <div class="space-y-4">
                                <!-- Symbol header -->
                                <div>
                                    <div class="flex items-center gap-2 mb-2">
                                        <h3 class="text-lg font-semibold text-warning">{nodeName}</h3>
                                        <span class="px-2 py-0.5 rounded text-xs {getKindColor(kindStr).bg} {getKindColor(kindStr).text} border {getKindColor(kindStr).border}">
                                            {kindStr}
                                        </span>
                                    </div>
                                    {#if signature}
                                        <div class="bg-bg-primary border border-border-default rounded-sm p-3 mb-2">
                                            <CodeBlock code={signature} language={getLanguageFromFile(node.location.file)} />
                                        </div>
                                    {/if}
                                    <div class="text-xs text-text-secondary/50 font-mono">
                                        {#if getGitHubUrl(node)}
                                            <a
                                                href={getGitHubUrl(node)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="hover:text-warning hover:underline inline-flex items-center gap-1"
                                            >
                                                {cleanFilePath(node.location.file)}:{node.location.start_line}
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        {:else}
                                            {cleanFilePath(node.location.file)}:{node.location.start_line}
                                        {/if}
                                    </div>
                                </div>

                                <!-- Metrics -->
                                <div class="flex flex-wrap gap-2">
                                    {#if node.metadata.complexity}
                                        <span class="px-2 py-1 rounded text-xs bg-bg-primary border border-border-default">
                                            Complexity: {node.metadata.complexity}
                                        </span>
                                    {/if}
                                    <span class="px-2 py-1 rounded text-xs bg-bg-primary border border-border-default">
                                        Fan-in: {node.metadata.fan_in}
                                    </span>
                                    <span class="px-2 py-1 rounded text-xs bg-bg-primary border border-border-default">
                                        Fan-out: {node.metadata.fan_out}
                                    </span>
                                    {#if node.metadata.is_public_api}
                                        <span class="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            Public API
                                        </span>
                                    {/if}
                                </div>

                                <!-- AI-Generated Documentation -->
                                {#if doc}
                                    <div class="space-y-4 pt-4 border-t border-border-default">
                                        <div>
                                            <h4 class="text-sm font-semibold text-text-secondary mb-2">Purpose</h4>
                                            <p class="text-sm text-text-secondary/80 leading-relaxed">{doc.purpose}</p>
                                        </div>

                                        {#if doc.explanation}
                                            <div>
                                                <h4 class="text-sm font-semibold text-text-secondary mb-2">Explanation</h4>
                                                <p class="text-sm text-text-secondary/80 leading-relaxed">{doc.explanation}</p>
                                            </div>
                                        {/if}

                                        {#if doc.complexity_notes}
                                            <div>
                                                <h4 class="text-sm font-semibold text-amber-400 mb-2">Complexity Notes</h4>
                                                <p class="text-sm text-text-secondary/80 leading-relaxed">{doc.complexity_notes}</p>
                                            </div>
                                        {/if}

                                        {#if doc.usage_hints}
                                            <div>
                                                <h4 class="text-sm font-semibold text-text-secondary mb-2">Usage Hints</h4>
                                                <p class="text-sm text-text-secondary/80 leading-relaxed">{doc.usage_hints}</p>
                                            </div>
                                        {/if}

                                        {#if doc.caller_references && doc.caller_references.length > 0}
                                            <div>
                                                <h4 class="text-sm font-semibold text-text-secondary mb-2">Called By</h4>
                                                <div class="flex flex-wrap gap-1">
                                                    {#each doc.caller_references as caller}
                                                        <span class="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                                            {caller}
                                                        </span>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}

                                        {#if doc.callee_references && doc.callee_references.length > 0}
                                            <div>
                                                <h4 class="text-sm font-semibold text-text-secondary mb-2">Calls</h4>
                                                <div class="flex flex-wrap gap-1">
                                                    {#each doc.callee_references as callee}
                                                        <span class="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                                            {callee}
                                                        </span>
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}

                                        {#if doc.semantic_cluster}
                                            <div>
                                                <h4 class="text-sm font-semibold text-text-secondary mb-2">Semantic Cluster</h4>
                                                <span class="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                    {doc.semantic_cluster}
                                                </span>
                                            </div>
                                        {/if}
                                    </div>
                                {:else}
                                    <div class="text-sm text-text-secondary/60 italic pt-4 border-t border-border-default">
                                        No AI-generated documentation available for this symbol.
                                    </div>
                                {/if}

                                <!-- Docstring if available -->
                                {#if node.metadata.docstring}
                                    <div class="pt-4 border-t border-border-default">
                                        <h4 class="text-sm font-semibold text-text-secondary mb-2">Source Docstring</h4>
                                        <div class="bg-bg-primary border border-border-default rounded-sm p-3 text-sm text-text-secondary/80 font-mono whitespace-pre-wrap">
                                            {node.metadata.docstring}
                                        </div>
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
    {/if}
</div>
