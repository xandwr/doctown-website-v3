<script lang="ts">
    import type { Docpack, DocpackStatus } from "$lib/types";
    import { STATUS_CONFIG } from "$lib/types";

    let {
        docpack,
        position,
        onClose,
        onStatusUpdate,
        onCancel,
    }: {
        docpack: Docpack | null;
        position: { top: number; left: number; width: number } | null;
        onClose: () => void;
        onStatusUpdate: (docpack: Docpack, newStatus: DocpackStatus) => void;
        onCancel?: (docpack: Docpack) => void;
    } = $props();

    let isVisible = $derived(!!docpack && !!position);
    let canPublish = $derived(docpack?.status === "valid");
    let isPublic = $derived(docpack?.status === "public");

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

    const statusConfig = $derived(
        docpack ? STATUS_CONFIG[docpack.status] : null,
    );

    // Color classes for status display
    const statusColorClasses: Record<string, string> = {
        orange: "text-orange-400 border-orange-500/40",
        green: "text-green-400 border-green-500/40",
        cyan: "text-cyan-400 border-cyan-500/40",
        red: "text-red-400 border-red-500/40",
    };
</script>

{#if isVisible && position && docpack}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        onclick={handleBackdropClick}
    >
        <div
            class="bg-zinc-900 border border-white/30 rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200"
        >
            <!-- Header -->
            <div class="border-b border-white/20 p-6">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold text-white mb-1">
                            {docpack.name}
                        </h2>
                        <p class="text-white/50 text-sm font-mono">
                            {docpack.full_name}
                        </p>
                    </div>
                    <button
                        onclick={onClose}
                        class="text-white/50 hover:text-white transition-colors p-1"
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
                        class="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3"
                    >
                        Status
                    </h3>
                    <div
                        class="bg-black/30 border border-white/10 rounded-lg p-4"
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
                        <p class="text-white/60 text-sm">
                            {statusConfig?.description}
                        </p>
                    </div>
                </div>

                <!-- Docpack Info -->
                {#if docpack.description}
                    <div>
                        <h3
                            class="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3"
                        >
                            Description
                        </h3>
                        <p class="text-white/80 text-sm">
                            {docpack.description}
                        </p>
                    </div>
                {/if}

                <!-- Technical Details -->
                <div>
                    <h3
                        class="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3"
                    >
                        Technical Details
                    </h3>
                    <div
                        class="bg-black/30 border border-white/10 rounded-lg p-4 space-y-2 font-mono text-sm"
                    >
                        <div class="flex justify-between">
                            <span class="text-white/50">Repository:</span>
                            <a
                                href={docpack.repo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-cyan-400 hover:underline"
                            >
                                {docpack.full_name}
                            </a>
                        </div>
                        {#if docpack.version}
                            <div class="flex justify-between">
                                <span class="text-white/50">Version:</span>
                                <span class="text-white"
                                    >v{docpack.version}</span
                                >
                            </div>
                        {/if}
                        {#if docpack.commit_hash}
                            <div class="flex justify-between">
                                <span class="text-white/50">Commit:</span>
                                <span class="text-white"
                                    >{docpack.commit_hash.substring(0, 8)}</span
                                >
                            </div>
                        {/if}
                        {#if docpack.language}
                            <div class="flex justify-between">
                                <span class="text-white/50">Language:</span>
                                <span class="text-white"
                                    >{docpack.language}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Publishing Section -->
                <div>
                    <h3
                        class="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3"
                    >
                        Publishing
                    </h3>
                    <div
                        class="bg-black/30 border border-white/10 rounded-lg p-4"
                    >
                        {#if docpack.status === "pending"}
                            <div
                                class="flex items-center gap-2 text-orange-400"
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
                            <p class="text-white/50 text-xs mt-2 mb-4">
                                Once generated and validated, you'll be able to
                                publish this docpack to the commons.
                            </p>
                            {#if onCancel}
                                <button
                                    onclick={handleCancel}
                                    class="w-full bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg px-4 py-2 font-semibold hover:bg-red-500/30 transition-colors"
                                >
                                    Cancel and Remove
                                </button>
                            {/if}
                        {:else if docpack.status === "valid"}
                            <p class="text-white/70 text-sm mb-4">
                                This docpack is valid and ready to be published.
                                Publishing will make it available globally in
                                the commons for all users.
                            </p>
                            <button
                                onclick={handlePublish}
                                class="w-full bg-green-500/20 text-green-400 border border-green-500/40 rounded-lg px-4 py-2 font-semibold hover:bg-green-500/30 transition-colors"
                            >
                                Publish to Commons
                            </button>
                        {:else if docpack.status === "public"}
                            <div
                                class="flex items-center gap-2 text-cyan-400 mb-4"
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
                            <p class="text-white/60 text-sm mb-4">
                                This docpack is publicly available. Users can
                                discover and access it from the commons.
                            </p>
                            <button
                                onclick={handleUnpublish}
                                class="w-full bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg px-4 py-2 font-semibold hover:bg-red-500/30 transition-colors"
                            >
                                Unpublish from Commons
                            </button>
                        {:else if docpack.status === "failed"}
                            <div
                                class="flex items-center gap-2 text-red-400 mb-2"
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
                            <p class="text-white/50 text-xs">
                                The docpack generation encountered an error.
                                Check the logs or try regenerating.
                            </p>
                        {/if}
                    </div>
                </div>

                <!-- Future: GitHub Actions Integration Info -->
                <div class="border-t border-white/10 pt-4">
                    <p class="text-white/40 text-xs font-mono">
                        💡 Docpacks are automatically regenerated on each push
                        via GitHub Actions
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="border-t border-white/20 p-4 bg-black/20">
                <button
                    onclick={onClose}
                    class="w-full bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 transition-colors"
                >
                    Close
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
