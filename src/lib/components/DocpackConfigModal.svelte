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
    }: {
        docpack: Docpack | null;
        position: { top: number; left: number; width: number } | null;
        onClose: () => void;
        onStatusUpdate: (docpack: Docpack, newStatus: DocpackStatus) => void;
        onCancel?: (docpack: Docpack) => void;
        onDelete?: (docpack: Docpack) => void;
    } = $props();

    let isVisible = $derived(!!docpack && !!position);
    let canPublish = $derived(docpack?.status === "valid");
    let isPublic = $derived(docpack?.status === "public");
    let showDeleteConfirm = $state(false);

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

    const statusConfig = $derived(
        docpack ? STATUS_CONFIG[docpack.status] : null,
    );

    // Color classes for status display - liminal palette
    const statusColorClasses: Record<string, string> = {
        orange: "text-rust border-rust/40",
        green: "text-corpse border-corpse/40",
        cyan: "text-corpse border-corpse/40",
        red: "text-decay border-decay/40",
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
            class="bg-fog border border-ash max-w-xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200"
        >
            <!-- Header -->
            <div class="border-b border-ash px-5 py-4">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                        <h2 class="text-xl font-normal text-whisper mb-0.5 truncate">
                            {docpack.name}
                        </h2>
                        <p class="text-shadow text-xs font-mono truncate">
                            {docpack.full_name.replace('/', ':')}
                        </p>
                    </div>
                    <button
                        onclick={(e) => { e.stopPropagation(); onClose(); }}
                        class="text-shadow hover:text-whisper transition-colors shrink"
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
                        class="px-3 py-1.5 text-xs font-mono border rounded-full {(docpack.status === 'valid' || docpack.status === 'public') ? 'text-status-valid border-status-valid/40' : 'text-status-invalid border-status-invalid/40'}"
                    >
                        {(docpack.status === "valid" || docpack.status === "public") ? "valid" : docpack.status}
                    </div>

                    <!-- Privacy Status Bubble (only shown for valid/public docpacks) -->
                    <!-- Green for public, Purple for private -->
                    {#if docpack.status === "valid" || docpack.status === "public"}
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
                            class="px-3 py-1.5 text-xs font-mono border rounded-full cursor-pointer transition-colors {docpack.status === 'public' ? 'text-privacy-public border-privacy-public/40 hover:bg-privacy-public/10' : 'text-privacy-private border-privacy-private/40 hover:bg-privacy-private/10'}"
                            role="button"
                            tabindex="0"
                            title="Click to toggle privacy"
                        >
                            {docpack.status === "public" ? "public" : "private"}
                        </div>
                    {/if}
                </div>

                <!-- Description (if exists) -->
                {#if docpack.description}
                    <div class="border-t border-ash pt-4">
                        <p class="text-sm text-echo leading-relaxed">
                            {docpack.description}
                        </p>
                    </div>
                {/if}

                <!-- Technical Details (compact) -->
                <div class="border-t border-ash pt-4 space-y-2 font-mono text-xs">
                    <div class="flex justify-between gap-4">
                        <span class="text-shadow">repo</span>
                        <a
                            href={docpack.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-corpse hover:underline truncate"
                        >
                            {docpack.full_name.replace('/', ':')}
                        </a>
                    </div>
                    {#if docpack.version}
                        <div class="flex justify-between gap-4">
                            <span class="text-shadow">version</span>
                            <span class="text-whisper">v{docpack.version}</span>
                        </div>
                    {/if}
                    {#if docpack.commit_hash}
                        <div class="flex justify-between gap-4">
                            <span class="text-shadow">commit</span>
                            <span class="text-whisper">{docpack.commit_hash.substring(0, 8)}</span>
                        </div>
                    {/if}
                    {#if docpack.language}
                        <div class="flex justify-between gap-4">
                            <span class="text-shadow">language</span>
                            <span class="text-whisper">{docpack.language}</span>
                        </div>
                    {/if}
                </div>

                <!-- Actions -->
                <div class="border-t border-ash pt-4 space-y-3">
                    <!-- Download (if available) -->
                    {#if docpack.file_url && (docpack.status === "valid" || docpack.status === "public")}
                        <a
                            href={docpack.file_url}
                            download
                            class="block w-full bg-action-primary/20 text-action-primary border border-action-primary/40 px-4 py-2 text-sm font-medium hover:bg-action-primary/30 transition-colors text-center"
                        >
                            Download
                        </a>
                    {/if}

                    <!-- Pending State -->
                    {#if docpack.status === "pending"}
                        <div class="text-xs text-shadow">
                            Generation in progress...
                        </div>
                        {#if onCancel}
                            <button
                                onclick={handleCancel}
                                class="w-full bg-action-cancel/20 text-action-cancel border border-action-cancel/40 px-4 py-2 text-sm font-medium hover:bg-action-cancel/30 transition-colors"
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

            <!-- Footer - Danger Zone (only shown when onDelete is provided, i.e., owner's view) -->
            {#if onDelete}
                <p class="pl-5 mb-1 opacity-20 text-action-danger"># - the danger zone - #</p>
                <div class="border-t border-ash px-5 py-3 flex gap-2 bg-action-danger/10">
                    {#if !showDeleteConfirm}
                        <button
                            onclick={handleDeleteClick}
                            class="bg-action-danger/20 hover:bg-action-danger/30 text-action-danger border-2 border-action-danger/40 px-4 py-1.5 text-xs transition-colors"
                        >
                            Delete
                        </button>
                    {/if}
                </div>
            {/if}
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
        <div class="bg-fog border border-action-danger max-w-sm w-full mx-4 overflow-hidden">
            <!-- Header -->
            <div class="border-b border-ash px-5 py-4">
                <h3 class="text-lg font-normal text-action-danger">Delete Docpack?</h3>
            </div>

            <!-- Content -->
            <div class="px-5 py-4">
                <p class="text-sm text-echo mb-2">
                    Delete <span class="text-whisper font-mono">{docpack.name}</span>?
                </p>
                <p class="text-xs text-shadow">
                    This cannot be undone.
                </p>
            </div>

            <!-- Footer -->
            <div class="border-t border-ash px-5 py-3 flex gap-2">
                <button
                    onclick={handleDeleteCancel}
                    class="flex-1 bg-ash/50 hover:bg-ash text-whisper px-4 py-1.5 text-xs transition-colors"
                >
                    Cancel
                </button>
                <button
                    onclick={handleDeleteConfirm}
                    class="flex-1 bg-action-danger/20 hover:bg-action-danger/30 text-action-danger border border-action-danger/40 px-4 py-1.5 text-xs font-medium transition-colors"
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
</style>
