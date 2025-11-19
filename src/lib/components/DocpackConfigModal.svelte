<script lang="ts">
    import type { Docpack, DocpackStatus } from "$lib/types";
    import { STATUS_CONFIG } from "$lib/types";

    let {
        docpack,
        position,
        onClose,
        onStatusUpdate,
        onCancel,
        onDelete,
        onDocpackUpdated,
    }: {
        docpack: Docpack | null;
        position: { top: number; left: number; width: number } | null;
        onClose: () => void;
        onStatusUpdate: (docpack: Docpack, newStatus: DocpackStatus) => void;
        onCancel?: (docpack: Docpack) => void;
        onDelete?: (docpack: Docpack) => void;
        onDocpackUpdated?: (updatedDocpack: Docpack) => void;
    } = $props();

    let isVisible = $derived(!!docpack && !!position);
    let canPublish = $derived(docpack?.status === "valid");
    let isPublic = $derived(docpack?.status === "public");
    let showDeleteConfirm = $state(false);
    let isEditingDescription = $state(false);
    let editedDescription = $state("");
    let isSavingDescription = $state(false);
    let isTogglingFrozen = $state(false);

    // Prevent body scroll when modal is open
    $effect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Cleanup function to restore scroll on unmount
        return () => {
            document.body.style.overflow = '';
        };
    });

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    function handlePublish() {
        if (docpack && canPublish) {
            onStatusUpdate(docpack, "public");
        }
    }

    function handleUnpublish() {
        if (docpack && isPublic) {
            onStatusUpdate(docpack, "valid");
        }
    }

    function handleCancel() {
        if (docpack && onCancel) {
            onCancel(docpack);
        }
    }

    function handleDeleteClick() {
        showDeleteConfirm = true;
    }

    function handleDeleteConfirm() {
        if (docpack && onDelete) {
            onDelete(docpack);
            showDeleteConfirm = false;
        }
    }

    function handleDeleteCancel() {
        showDeleteConfirm = false;
    }

    async function handleToggleFrozen() {
        if (!docpack || isTogglingFrozen) return;

        isTogglingFrozen = true;

        try {
            const response = await fetch(`/api/docpacks/${docpack.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    frozen: !docpack.frozen,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                // Notify parent of the update to trigger proper reactivity
                if (onDocpackUpdated) {
                    onDocpackUpdated(result.docpack);
                }
            } else {
                console.error("Failed to toggle frozen state");
                alert("Failed to toggle frozen state. Please try again.");
            }
        } catch (err) {
            console.error("Error toggling frozen state:", err);
            alert("Error toggling frozen state. Please try again.");
        } finally {
            isTogglingFrozen = false;
        }
    }

    function startEditingDescription(event: MouseEvent) {
        event.stopPropagation();
        editedDescription = docpack?.description || "";
        isEditingDescription = true;
    }

    function cancelEditingDescription(event: MouseEvent) {
        event.stopPropagation();
        isEditingDescription = false;
        editedDescription = docpack?.description || "";
    }

    async function saveDescription(event: MouseEvent) {
        event.stopPropagation();
        if (!docpack) return;
        
        isSavingDescription = true;

        try {
            const response = await fetch(`/api/docpacks/${docpack.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description: editedDescription || null,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                // Notify parent of the update to trigger proper reactivity
                if (onDocpackUpdated) {
                    onDocpackUpdated(result.docpack);
                }
                isEditingDescription = false;
            } else {
                console.error("Failed to update description");
                alert("Failed to update description. Please try again.");
            }
        } catch (err) {
            console.error("Error updating description:", err);
            alert("Error updating description. Please try again.");
        } finally {
            isSavingDescription = false;
        }
    }

    const statusConfig = $derived(
        docpack ? STATUS_CONFIG[docpack.status] : null,
    );

    // Color classes for status display - new color system
    const statusColorClasses: Record<string, string> = {
        orange: "text-warning border-warning/40",
        green: "text-success border-success/40",
        cyan: "text-primary border-primary/40",
        red: "text-danger border-danger/40",
    };
</script>

{#if isVisible && position && docpack}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-void/80 backdrop-blur-sm z-50 flex items-center justify-center"
        onclick={handleBackdropClick}
    >
        <div
            class="bg-bg-elevated border border-border-strong rounded-md max-w-xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200"
        >
            <!-- Header -->
            <div class="border-b border-border-strong px-5 py-4">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                        <h2 class="text-xl font-normal text-text-primary mb-0.5 truncate">
                            {docpack.name}
                        </h2>
                        <p class="text-text-tertiary text-xs font-mono truncate">
                            {docpack.full_name.replace('/', ':')}
                        </p>
                    </div>
                    <button
                        onclick={(e) => { e.stopPropagation(); onClose(); }}
                        class="text-text-tertiary hover:text-text-primary transition-colors shrink"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-5 space-y-4">
                <!-- Status Bubbles -->
                <div class="flex items-center gap-2">
                    <!-- Validity Status Bubble - Blue for valid, Red for invalid/failed -->
                    <div
                        class="px-3 py-1.5 text-xs font-mono border rounded-sm {(docpack.status === 'valid' || docpack.status === 'public') ? 'text-status-valid border-status-valid/40' : 'text-status-invalid border-status-invalid/40'}"
                    >
                        {(docpack.status === "valid" || docpack.status === "public") ? "valid" : docpack.status}
                    </div>

                    <!-- Privacy Status Bubble (only shown for valid/public docpacks) -->
                    <!-- Green for public, Purple for private -->
                    {#if docpack.status === "valid" || docpack.status === "public"}
                        <div class="flex items-center gap-1.5">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                onclick={() => {
                                    if (docpack.status === "public") {
                                        handleUnpublish();
                                    } else {
                                        handlePublish();
                                    }
                                }}
                                class="px-3 py-1.5 text-xs font-mono border rounded-sm cursor-pointer transition-colors {docpack.status === 'public' ? 'text-privacy-public border-privacy-public/40 hover:bg-privacy-public/10' : 'text-privacy-private border-privacy-private/40 hover:bg-privacy-private/10'}"
                                role="button"
                                tabindex="0"
                                title="Click to toggle privacy"
                            >
                                {docpack.status === "public" ? "public" : "private"}
                            </div>
                            <!-- Animated hint arrow with text -->
                            <div class="privacy-hint-arrow flex items-center gap-1 text-text-tertiary">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 16 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                <span class="text-[10px] font-mono whitespace-nowrap">Click to change!</span>
                            </div>
                        </div>
                    {/if}

                    <!-- Action Buttons (only shown when onDelete is provided, i.e., owner's view) -->
                    {#if onDelete}
                        <div class="ml-auto flex items-center gap-3">
                            <!-- Freeze Toggle Button with Label -->
                            <div class="flex flex-col items-center gap-1">
                                <span class="text-[10px] text-text-tertiary font-mono">Frozen:</span>
                                <button
                                    onclick={handleToggleFrozen}
                                    disabled={isTogglingFrozen}
                                    class="w-8 h-8 flex items-center justify-center border rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed {docpack.frozen ? 'bg-primary/20 border-primary/50 frozen-effect' : 'bg-success/20 border-success/50 mutable-pulse'}"
                                    aria-label={docpack.frozen ? "Unfreeze docpack" : "Freeze docpack"}
                                    title={docpack.frozen ? "Frozen - click to allow updates" : "Mutable - click to freeze"}
                                >
                                    {#if docpack.frozen}
                                        <span class="text-sm">🔒</span>
                                    {:else}
                                        <span class="text-sm">🔓</span>
                                    {/if}
                                </button>
                            </div>

                            <!-- Delete Button with Label -->
                            <div class="flex flex-col items-center gap-1">
                                <span class="text-[10px] text-text-tertiary font-mono">Delete:</span>
                                <button
                                    onclick={handleDeleteClick}
                                    class="w-8 h-8 flex items-center justify-center bg-action-danger border border-action-danger rounded-sm hover:bg-action-danger/80 transition-colors"
                                    aria-label="Delete docpack"
                                    title="Delete docpack"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-4 w-4 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Description -->
                <div class="border-t border-border-strong pt-4">
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="text-text-tertiary text-xs font-mono">Description</span>
                        {#if !isEditingDescription}
                            <button
                                onclick={startEditingDescription}
                                class="text-xs text-primary hover:text-primary/80 font-mono transition-colors"
                                title="Edit description"
                            >
                                Edit
                            </button>
                        {/if}
                    </div>
                    {#if isEditingDescription}
                        <div onclick={(e) => e.stopPropagation()}>
                            <textarea
                                bind:value={editedDescription}
                                class="w-full text-sm bg-bg-primary border border-border-default rounded-sm p-2 text-text-primary focus:outline-none focus:border-primary resize-none"
                                rows="4"
                                placeholder="Enter a description for this docpack..."
                            ></textarea>
                            <div class="flex gap-2 mt-2">
                                <button
                                    onclick={saveDescription}
                                    disabled={isSavingDescription}
                                    class="px-3 py-1.5 text-xs font-mono bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingDescription ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onclick={cancelEditingDescription}
                                    disabled={isSavingDescription}
                                    class="px-3 py-1.5 text-xs font-mono bg-bg-primary hover:bg-hover-bg text-text-secondary border border-border-default rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    {:else}
                        <p class="text-sm text-text-secondary leading-relaxed">
                            {docpack.description || "No description provided"}
                        </p>
                    {/if}
                </div>

                <!-- Technical Details (compact) -->
                <div class="border-t border-border-strong pt-4 space-y-2 font-mono text-xs">
                    <div class="flex justify-between gap-4">
                        <span class="text-text-tertiary">repo</span>
                        <a
                            href={docpack.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary hover:underline truncate"
                        >
                            {docpack.full_name.replace('/', ':')}
                        </a>
                    </div>
                    {#if docpack.tracked_branch}
                        <div class="flex justify-between gap-4">
                            <span class="text-text-tertiary">branch</span>
                            <span class="text-text-primary">{docpack.tracked_branch}</span>
                        </div>
                    {/if}
                    {#if docpack.commit_hash}
                        <div class="flex justify-between gap-4">
                            <span class="text-text-tertiary">commit</span>
                            <a
                                href="{docpack.repo_url}/commit/{docpack.commit_hash}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary hover:underline"
                            >
                                {docpack.commit_hash.substring(0, 8)}
                            </a>
                        </div>
                    {/if}
                    {#if docpack.language}
                        <div class="flex justify-between gap-4">
                            <span class="text-text-tertiary">language</span>
                            <span class="text-text-primary">{docpack.language}</span>
                        </div>
                    {/if}
                </div>

                <!-- Actions -->
                <div class="border-t border-border-strong pt-4 space-y-3">
                    <!-- Download (if available) -->
                    {#if docpack.file_url && (docpack.status === "valid" || docpack.status === "public")}
                        <a
                            href={docpack.file_url}
                            download
                            class="block w-full bg-action-primary/20 text-action-primary border border-action-primary/40 rounded-sm px-4 py-2 text-sm font-medium hover:bg-action-primary/30 transition-colors text-center"
                        >
                            Download
                        </a>
                        <a
                            href="/docpacks/{docpack.id}"
                            class="block w-full bg-success/10 text-success border border-success/40 rounded-sm px-4 py-2 text-sm font-medium hover:bg-success/20 transition-colors text-center"
                        >
                            View Docs
                        </a>
                    {/if}

                    <!-- Pending State -->
                    {#if docpack.status === "pending"}
                        <div class="text-xs text-text-tertiary">
                            Generation in progress...
                        </div>
                        {#if onCancel}
                            <button
                                onclick={handleCancel}
                                class="w-full bg-action-cancel/20 text-action-cancel border border-action-cancel/40 rounded-sm px-4 py-2 text-sm font-medium hover:bg-action-cancel/30 transition-colors"
                            >
                                Cancel
                            </button>
                        {/if}
                    {/if}

                    <!-- Failed State -->
                    {#if docpack.status === "failed"}
                        <div class="text-xs text-status-invalid">
                            Generation failed. Check logs.
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && docpack}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-void/90 backdrop-blur-sm z-60 flex items-center justify-center"
        onclick={(e) => e.target === e.currentTarget && handleDeleteCancel()}
    >
        <div class="bg-bg-elevated border border-action-danger rounded-md max-w-sm w-full mx-4 overflow-hidden">
            <!-- Header -->
            <div class="border-b border-border-strong px-5 py-4">
                <h3 class="text-lg font-normal text-action-danger">Delete Docpack?</h3>
            </div>

            <!-- Content -->
            <div class="px-5 py-4">
                <p class="text-sm text-text-secondary mb-2">
                    Delete <span class="text-text-primary font-mono">{docpack.name}</span>?
                </p>
                <p class="text-xs text-text-tertiary">
                    This cannot be undone.
                </p>
            </div>

            <!-- Footer -->
            <div class="border-t border-border-strong px-5 py-3 flex gap-2">
                <button
                    onclick={handleDeleteCancel}
                    class="flex-1 bg-border-strong/50 hover:bg-border-strong text-text-primary rounded-sm px-4 py-1.5 text-xs transition-colors"
                >
                    Cancel
                </button>
                <button
                    onclick={handleDeleteConfirm}
                    class="flex-1 bg-action-danger/20 hover:bg-action-danger/30 text-action-danger border border-action-danger/40 rounded-sm px-4 py-1.5 text-xs font-medium transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes zoom-in {
        from {
            transform: scale(0.95);
        }
        to {
            transform: scale(1);
        }
    }

    .animate-in {
        animation:
            fade-in 0.2s ease-out,
            zoom-in 0.2s ease-out;
    }

    /* Frozen effect - blue glow */
    @keyframes frozen-glow {
        0%, 100% {
            box-shadow: 0 0 4px rgba(59, 130, 246, 0.4), 0 0 8px rgba(59, 130, 246, 0.2);
        }
        50% {
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.6), 0 0 16px rgba(59, 130, 246, 0.3);
        }
    }

    .frozen-effect {
        animation: frozen-glow 2s ease-in-out infinite;
    }

    /* Mutable pulse - green pulse */
    @keyframes mutable-glow {
        0%, 100% {
            box-shadow: 0 0 4px rgba(16, 185, 129, 0.4), 0 0 8px rgba(16, 185, 129, 0.2);
        }
        50% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.6), 0 0 16px rgba(16, 185, 129, 0.3);
        }
    }

    .mutable-pulse {
        animation: mutable-glow 2s ease-in-out infinite;
    }

    /* Privacy hint arrow animation */
    @keyframes hint-nudge {
        0%, 100% {
            transform: translateX(0);
            opacity: 0.4;
        }
        50% {
            transform: translateX(-3px);
            opacity: 0.7;
        }
    }

    .privacy-hint-arrow {
        animation: hint-nudge 2s ease-in-out infinite;
    }
</style>
