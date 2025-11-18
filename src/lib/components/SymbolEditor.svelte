<script lang="ts">
    import type { DocpackSymbol, DocpackDocumentation, DocpackParameter } from "$lib/types";

    import { onMount, tick } from "svelte";

    interface Props {
        symbol: DocpackSymbol;
        doc: DocpackDocumentation;
        onSave: (edits: any) => Promise<void>;
        onCancel: () => void;
        onRevert: () => Promise<void>;
        hasEdits: boolean;
        focusField?: string;
    }

    let { symbol, doc, onSave, onCancel, onRevert, hasEdits, focusField }: Props = $props();

    // Focus the target field when component mounts
    onMount(async () => {
        if (focusField) {
            await tick();
            // Handle special cases for sections without direct input IDs
            let elementId: string;
            if (focusField === 'notes') {
                // Scroll to notes section header
                elementId = 'notes-section';
            } else if (focusField === 'parameters') {
                // Scroll to parameters section header
                elementId = 'parameters-section';
            } else {
                elementId = `${focusField}-input`;
            }
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Only focus if it's an input/textarea
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.focus();
                }
            }
        }
    });

    // Local state for editing
    let signature = $state(symbol.signature);
    let kind = $state(symbol.kind);
    let summary = $state(doc.summary);
    let description = $state(doc.description);
    let parameters = $state<DocpackParameter[]>(doc.parameters || []);
    let returns = $state(doc.returns || "");
    let example = $state(doc.example || "");
    let notes = $state<string[]>(doc.notes || []);

    let saving = $state(false);
    let reverting = $state(false);

    function addParameter() {
        parameters = [...parameters, { name: "", type: "", description: "" }];
    }

    function removeParameter(index: number) {
        parameters = parameters.filter((_, i) => i !== index);
    }

    function addNote() {
        notes = [...notes, ""];
    }

    function removeNote(index: number) {
        notes = notes.filter((_, i) => i !== index);
    }

    async function handleSave() {
        saving = true;
        try {
            await onSave({
                symbol_id: symbol.id,
                signature,
                kind,
                summary,
                description,
                parameters,
                returns,
                example,
                notes: notes.filter(n => n.trim() !== ""),
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
        <!-- Symbol metadata -->
        <div class="space-y-3">
            <h3 class="text-sm font-semibold text-text-secondary">Symbol Metadata</h3>
            
            <div>
                <label for="kind-input" class="block text-xs text-text-secondary/70 mb-1">Kind</label>
                <input
                    id="kind-input"
                    type="text"
                    bind:value={kind}
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                />
            </div>

            <div>
                <label for="signature-input" class="block text-xs text-text-secondary/70 mb-1">Signature</label>
                <textarea
                    id="signature-input"
                    bind:value={signature}
                    rows="3"
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary font-mono focus:outline-none focus:border-warning"
                ></textarea>
            </div>
        </div>

        <!-- Documentation -->
        <div class="space-y-3">
            <h3 class="text-sm font-semibold text-text-secondary">Documentation</h3>
            
            <div>
                <label for="summary-input" class="block text-xs text-text-secondary/70 mb-1">Summary</label>
                <textarea
                    id="summary-input"
                    bind:value={summary}
                    rows="2"
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                ></textarea>
            </div>

            <div>
                <label for="description-input" class="block text-xs text-text-secondary/70 mb-1">Description</label>
                <textarea
                    id="description-input"
                    bind:value={description}
                    rows="4"
                    class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                ></textarea>
            </div>
        </div>

        <!-- Parameters -->
        <div class="space-y-3" id="parameters-section">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-text-secondary">Parameters</h3>
                <button
                    onclick={addParameter}
                    class="px-2 py-1 text-xs bg-warning/10 text-warning hover:bg-warning/20 rounded-sm transition-colors"
                >
                    + Add
                </button>
            </div>
            
            {#each parameters as param, i}
                <div class="bg-bg-primary border border-border-default rounded-sm p-3 space-y-2">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-text-secondary/50">Parameter {i + 1}</span>
                        <button
                            onclick={() => removeParameter(i)}
                            class="text-xs text-danger hover:text-danger/80"
                        >
                            Remove
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label for="param-name-{i}" class="block text-xs text-text-secondary/70 mb-1">Name</label>
                            <input
                                id="param-name-{i}"
                                type="text"
                                bind:value={param.name}
                                class="w-full bg-bg-primary border border-border-default rounded-sm px-2 py-1 text-sm text-text-secondary focus:outline-none focus:border-warning"
                            />
                        </div>
                        <div>
                            <label for="param-type-{i}" class="block text-xs text-text-secondary/70 mb-1">Type</label>
                            <input
                                id="param-type-{i}"
                                type="text"
                                bind:value={param.type}
                                class="w-full bg-bg-primary border border-border-default rounded-sm px-2 py-1 text-sm text-text-secondary focus:outline-none focus:border-warning"
                            />
                        </div>
                    </div>
                    <div>
                        <label for="param-desc-{i}" class="block text-xs text-text-secondary/70 mb-1">Description</label>
                        <textarea
                            id="param-desc-{i}"
                            bind:value={param.description}
                            rows="2"
                            class="w-full bg-bg-primary border border-border-default rounded-sm px-2 py-1 text-sm text-text-secondary focus:outline-none focus:border-warning"
                        ></textarea>
                    </div>
                </div>
            {/each}
            
            {#if parameters.length === 0}
                <div class="text-xs text-text-secondary/50 italic">No parameters</div>
            {/if}
        </div>

        <!-- Returns -->
        <div class="space-y-3">
            <label for="returns-input" class="text-sm font-semibold text-text-secondary block">Returns</label>
            <textarea
                id="returns-input"
                bind:value={returns}
                rows="2"
                class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
            ></textarea>
        </div>

        <!-- Example -->
        <div class="space-y-3">
            <label for="example-input" class="text-sm font-semibold text-text-secondary block">Example</label>
            <textarea
                id="example-input"
                bind:value={example}
                rows="4"
                class="w-full bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary font-mono focus:outline-none focus:border-warning"
            ></textarea>
        </div>

        <!-- Notes -->
        <div class="space-y-3" id="notes-section">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-text-secondary">Notes</h3>
                <button
                    onclick={addNote}
                    class="px-2 py-1 text-xs bg-warning/10 text-warning hover:bg-warning/20 rounded-sm transition-colors"
                >
                    + Add
                </button>
            </div>
            
            {#each notes as note, i}
                <div class="flex gap-2">
                    <input
                        type="text"
                        bind:value={notes[i]}
                        class="flex-1 bg-bg-primary border border-border-default rounded-sm px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-warning"
                        placeholder="Add a note..."
                    />
                    <button
                        onclick={() => removeNote(i)}
                        class="px-3 text-xs text-danger hover:text-danger/80"
                    >
                        Remove
                    </button>
                </div>
            {/each}
            
            {#if notes.length === 0}
                <div class="text-xs text-text-secondary/50 italic">No notes</div>
            {/if}
        </div>
    </div>
</div>
