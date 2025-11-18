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
            class="bg-fog border border-ash max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200"
        >
            <!-- Header -->
            <div class="border-b border-ash p-6">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-whisper mb-1">
                            {docpack.name}
                        </h2>
                        <p class="text-shadow text-sm font-mono">
                            {docpack.full_name}
                        </p>
                    </div>
                    <button
                        onclick={(e) => { e.stopPropagation(); onClose(); }}
                        class="text-shadow hover:text-whisper transition-colors p-1"
                        aria-label="Close"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-6 w-6"
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
            <div class="p-6 space-y-6">
                <!-- Status Section -->
                <div>
                    <h3
                        class="text-sm font-semibold text-echo uppercase tracking-wider mb-3"
                    >
                        Status
                    </h3>
                    <div
                        class="bg-concrete/50 border border-fog p-4"
                    >
                        <div class="flex items-center gap-3 mb-2">
                            <span
                                class="text-lg font-mono {statusColorClasses[
                                    statusConfig?.color || 'orange'
                                ]}"
                            >
                                {statusConfig?.label}
                            </span>
                        </div>
                        <p class="text-echo text-sm">
                            {statusConfig?.description}
                        </p>
                    </div>
                </div>

                <!-- Docpack Info -->
                {#if docpack.description}
                    <div>
                        <h3
                            class="text-sm font-semibold text-echo uppercase tracking-wider mb-3"
                        >
                            Description
                        </h3>
                        <p class="text-whisper text-sm">
                            {docpack.description}
                        </p>
                    </div>
                {/if}

                <!-- Technical Details -->
                <div>
                    <h3
                        class="text-sm font-semibold text-echo uppercase tracking-wider mb-3"
                    >
                        Technical Details
                    </h3>
                    <div
                        class="bg-concrete/50 border border-fog p-4 space-y-2 font-mono text-sm"
                    >
                        <div class="flex justify-between">
                            <span class="text-shadow">Repository:</span>
                            <a
                                href={docpack.repo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-corpse hover:underline"
                            >
                                {docpack.full_name}
                            </a>
                        </div>
                        {#if docpack.version}
                            <div class="flex justify-between">
                                <span class="text-shadow">Version:</span>
                                <span class="text-whisper"
                                    >v{docpack.version}</span
                                >
                            </div>
                        {/if}
                        {#if docpack.commit_hash}
                            <div class="flex justify-between">
                                <span class="text-shadow">Commit:</span>
                                <span class="text-whisper"
                                    >{docpack.commit_hash.substring(0, 8)}</span
                                >
                            </div>
                        {/if}
                        {#if docpack.language}
                            <div class="flex justify-between">
                                <span class="text-shadow">Language:</span>
                                <span class="text-whisper"
                                    >{docpack.language}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Download Section (for completed docpacks) -->
                {#if docpack.file_url && (docpack.status === "valid" || docpack.status === "public")}
                    <div>
                        <h3
                            class="text-sm font-semibold text-echo uppercase tracking-wider mb-3"
                        >
                            Download
                        </h3>
                        <a
                            href={docpack.file_url}
                            download
                            class="block w-full bg-corpse/20 text-corpse border border-corpse/40 px-4 py-3 font-semibold hover:bg-corpse/30 transition-colors text-center"
                        >
                            <div class="flex items-center justify-center gap-2">
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
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                <span>Download Docpack</span>
                            </div>
                        </a>
                    </div>
                {/if}

                <!-- Publishing Section -->
                <div>
                    <h3
                        class="text-sm font-semibold text-echo uppercase tracking-wider mb-3"
                    >
                        Publishing
                    </h3>
                    <div
                        class="bg-concrete/50 border border-fog p-4"
                    >
                        {#if docpack.status === "pending"}
                            <div
                                class="flex items-center gap-2 text-rust"
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span class="text-sm"
                                    >Docpack generation in progress...</span
                                >
                            </div>
                            <p class="text-shadow text-xs mt-2 mb-4">
                                Once generated and validated, you'll be able to
                                publish this docpack to the commons.
                            </p>
                            {#if onCancel}
                                <button
                                    onclick={handleCancel}
                                    class="w-full bg-decay/20 text-decay border border-decay/40 rounded-lg px-4 py-2 font-semibold hover:bg-decay/30 transition-colors"
                                >
                                    Cancel and Remove
                                </button>
                            {/if}
                        {:else if docpack.status === "valid"}
                            <p class="text-echo text-sm mb-4">
                                This docpack is valid and ready to be published.
                                Publishing will make it available globally in
                                the commons for all users.
                            </p>
                            <button
                                onclick={handlePublish}
                                class="w-full bg-corpse/20 text-corpse border border-corpse/40 rounded-lg px-4 py-2 font-semibold hover:bg-corpse/30 transition-colors"
                            >
                                Publish to Commons
                            </button>
                        {:else if docpack.status === "public"}
                            <div
                                class="flex items-center gap-2 text-corpse mb-4"
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
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span class="text-sm font-semibold"
                                    >Live in Commons</span
                                >
                            </div>
                            <p class="text-echo text-sm mb-4">
                                This docpack is publicly available. Users can
                                discover and access it from the commons.
                            </p>
                            <button
                                onclick={handleUnpublish}
                                class="w-full bg-decay/20 text-decay border border-decay/40 rounded-lg px-4 py-2 font-semibold hover:bg-decay/30 transition-colors"
                            >
                                Unpublish from Commons
                            </button>
                        {:else if docpack.status === "failed"}
                            <div
                                class="flex items-center gap-2 text-decay mb-2"
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
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span class="text-sm font-semibold"
                                    >Generation Failed</span
                                >
                            </div>
                            <p class="text-shadow text-xs">
                                The docpack generation encountered an error.
                                Check the logs or try regenerating.
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- Future: GitHub Actions Integration Info -->
                <div class="border-t border-white/10 pt-4">
                    <p class="text-shadow text-xs font-mono">
                        💡 Docpacks are automatically regenerated on each push
                        via GitHub Actions
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="border-t border-ash p-4 bg-concrete/50">
                <div class="flex gap-3">
                    {#if onDelete && !showDeleteConfirm}
                        <button
                            onclick={handleDeleteClick}
                            class="bg-red-500/20 hover:bg-decay/30 text-decay border border-red-500/40 rounded-lg px-4 py-2 transition-colors font-semibold"
                        >
                            Delete
                        </button>
                    {/if}
                    <button
                        onclick={onClose}
                        class="flex-1 bg-fog hover:bg-ash text-whisper rounded-lg px-4 py-2 transition-colors"
                    >
                        Close
                    </button>
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
        class="fixed inset-0 bg-void/90 backdrop-blur-sm z-[60] flex items-center justify-center"
        onclick={(e) => e.target === e.currentTarget && handleDeleteCancel()}
    >
        <div class="bg-fog border border-decay/60 max-w-md w-full mx-4 overflow-hidden">
            <!-- Header -->
            <div class="border-b border-decay/50 p-6 bg-decay/20">
                <div class="flex items-center gap-3 text-decay">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <h3 class="text-xl font-bold">Delete Docpack?</h3>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6">
                <p class="text-white/80 mb-2">
                    Are you sure you want to delete <strong class="text-white font-mono">{docpack.name}</strong>?
                </p>
                <p class="text-shadow text-sm">
                    This action cannot be undone. The docpack file and all associated data will be permanently removed.
                </p>
            </div>

            <!-- Footer -->
            <div class="border-t border-ash p-4 bg-concrete/50 flex gap-3">
                <button
                    onclick={handleDeleteCancel}
                    class="flex-1 bg-fog hover:bg-ash text-whisper rounded-lg px-4 py-2 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onclick={handleDeleteConfirm}
                    class="flex-1 bg-blood hover:bg-decay text-whisper px-4 py-2 transition-colors font-semibold"
                >
                    Yes, Delete
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
