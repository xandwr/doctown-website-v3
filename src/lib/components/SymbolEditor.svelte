<script lang="ts">
    import type { BuilderGraphNode, SymbolDoc, GraphNodeKind } from "$lib/types";
    import { getNodeName, getNodeKindString } from "$lib/types";
    import { onMount, tick } from "svelte";

    interface Props {
        node: BuilderGraphNode;
        doc: SymbolDoc | null;
        onSave: (edits: any) => Promise<void>;
        onCancel: () => void;
        onRevert: () => Promise<void>;
        hasEdits: boolean;
        focusField?: string;
    }

    let { node, doc, onSave, onCancel, onRevert, hasEdits, focusField }: Props = $props();

    // Focus the target field when component mounts
    onMount(async () => {
        if (focusField) {
            await tick();
            const elementId = `${focusField}-input`;
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.focus();
                }
            }
        }
    });

    // Local state for editing (maps to new SymbolDoc fields)
    let purpose = $state(doc?.purpose || "");
    let explanation = $state(doc?.explanation || "");
    let complexityNotes = $state(doc?.complexity_notes || "");
    let usageHints = $state(doc?.usage_hints || "");

    let saving = $state(false);
    let reverting = $state(false);

    async function handleSave() {
        saving = true;
        try {
            await onSave({
                symbol_id: node.id,
                purpose,
                explanation,
                complexity_notes: complexityNotes || null,
                usage_hints: usageHints || null,
            });
        } finally {
            saving = false;
        }
    }

    async function handleRevert() {
        if (!confirm("Are you sure you want to revert all edits for this symbol?")) {
            return;
        }
        reverting = true;
        try {
            await onRevert();
        } finally {
            reverting = false;
        }
    }

    // Get signature for display
    function getSignature(): string | null {
        if ('Function' in node.kind) {
            return node.kind.Function.signature;
        }
        return null;
    }
</script>

<div class="flex flex-col h-full">
    <!-- Header with actions -->
    <div class="shrink-0 bg-warning/10 border-b border-border-default px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold text-warning">Edit Documentation</h2>
            {#if hasEdits}
                <span class="px-2 py-0.5 rounded text-[10px] bg-warning/20 text-warning">Modified</span>
            {/if}
        </div>
        <div class="flex items-center gap-2">
            {#if hasEdits}
                <button
                    onclick={handleRevert}
                    disabled={reverting}
                    class="px-3 py-1.5 text-xs bg-danger/10 text-danger hover:bg-danger/20 rounded-sm transition-colors disabled:opacity-50"
                >
                    {reverting ? "Reverting..." : "Revert"}
                </button>
            {/if}
            <button
                onclick={onCancel}
                class="px-3 py-1.5 text-xs bg-bg-primary border border-border-default text-text-secondary hover:bg-rust/5 rounded-sm transition-colors"
            >
                Cancel
            </button>
            <button
                onclick={handleSave}
                disabled={saving}
                class="px-3 py-1.5 text-xs bg-warning text-bg-primary hover:bg-warning/90 rounded-sm transition-colors disabled:opacity-50"
            >
                {saving ? "Saving..." : "Save"}
            </button>
        </div>
    </div>

    <!-- Editor form -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Symbol info (read-only) -->
        <div class="space-y-3">
            <h3 class="text-sm font-semibold text-text-secondary">Symbol</h3>

            <div class="bg-bg-primary border border-border-default rounded-sm p-3 space-y-2">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-warning">{getNodeName(node.kind)}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {getNodeKindString(node.kind)}
                    </span>
                </div>
                {#if getSignature()}
                    <div class="text-xs font-mono text-text-secondary/70 mt-1">
                        {getSignature()}
                    </div>
                {/if}
                <div class="text-xs text-text-secondary/50 font-mono">
                    {node.location.file}:{node.location.start_line}
                </div>
            </div>
        </div>

        <!-- Documentation fields -->
        <div class="space-y-4">
            <h3 class="text-sm font-semibold text-text-secondary">Documentation</h3>

            <div>
                <label for="purpose-input" class="block text-xs text-text-secondary/70 mb-1">Purpose</label>
                <textarea
                    id="purpose-input"
                    bind:value={purpose}
                    rows="2"
                    placeholder="Brief description of what this symbol does"
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                ></textarea>
            </div>

            <div>
                <label for="explanation-input" class="block text-xs text-text-secondary/70 mb-1">Explanation</label>
                <textarea
                    id="explanation-input"
                    bind:value={explanation}
                    rows="4"
                    placeholder="Detailed explanation of how it works"
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                ></textarea>
            </div>

            <div>
                <label for="complexity-input" class="block text-xs text-text-secondary/70 mb-1">Complexity Notes</label>
                <textarea
                    id="complexity-input"
                    bind:value={complexityNotes}
                    rows="2"
                    placeholder="Notes about algorithmic complexity, performance considerations, etc."
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                ></textarea>
            </div>

            <div>
                <label for="usage-input" class="block text-xs text-text-secondary/70 mb-1">Usage Hints</label>
                <textarea
                    id="usage-input"
                    bind:value={usageHints}
                    rows="3"
                    placeholder="Tips for using this symbol effectively"
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                ></textarea>
            </div>
        </div>

        <!-- Metadata (read-only info from graph) -->
        {#if node.metadata.complexity || node.metadata.fan_in > 0 || node.metadata.fan_out > 0}
            <div class="space-y-3">
                <h3 class="text-sm font-semibold text-text-secondary">Graph Metrics</h3>
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
                </div>
            </div>
        {/if}
    </div>
</div>
