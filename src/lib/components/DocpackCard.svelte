<script lang="ts">
	import type { Docpack } from "$lib/types";
	import { STATUS_CONFIG } from "$lib/types";

	let { docpack }: { docpack: Docpack } = $props();

	let showCopiedTooltip = $state(false);
	let isEditingDescription = $state(false);
	let editedDescription = $state(docpack.description || "");
	let isSavingDescription = $state(false);

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	}

	async function copyToClipboard(event: MouseEvent) {
		event.stopPropagation(); // Prevent opening the modal
		const textToCopy = docpack.full_name.replace("/", ":");

		try {
			await navigator.clipboard.writeText(textToCopy);
			showCopiedTooltip = true;
			setTimeout(() => {
				showCopiedTooltip = false;
			}, 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	}

	function startEditingDescription(event: MouseEvent) {
		event.stopPropagation();
		editedDescription = docpack.description || "";
		isEditingDescription = true;
	}

	function cancelEditingDescription(event: MouseEvent) {
		event.stopPropagation();
		isEditingDescription = false;
		editedDescription = docpack.description || "";
	}

	async function saveDescription(event: MouseEvent) {
		event.stopPropagation();
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
				docpack.description = result.docpack.description;
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

	const statusConfig = $derived(STATUS_CONFIG[docpack.status]);

	// Split username and repo for display
	const [username, repo] = $derived(docpack.full_name.split("/"));

	// Status badge styling - semantic, vibrant colors
	const statusClasses = $derived(
		docpack.status === "building" ? "bg-status-building/10 text-status-building border-status-building/30" :
		docpack.status === "pending" ? "bg-warning/10 text-warning border-warning/30" :
		docpack.status === "valid" ? "bg-status-valid/10 text-status-valid border-status-valid/30" :
		docpack.status === "public" ? "bg-status-public/10 text-status-public border-status-public/30" :
		docpack.status === "failed" ? "bg-status-failed/10 text-status-failed border-status-failed/30" :
		"bg-border-default/10 text-text-secondary border-border-default"
	);
</script>

<div
	class="bg-bg-secondary border border-border-default rounded-sm p-2 hover:border-border-strong transition-all cursor-pointer h-full flex flex-col"
>
	<!-- Top row: Name, Status Badge, and Updated Date -->
	<div class="flex items-start justify-between gap-1 mb-3">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative group"
			onmouseleave={() => (showCopiedTooltip = false)}
		>
			<button
				class="text-lg font-semibold text-text-primary text-left cursor-copy hover:text-primary transition-colors hover:bg-hover-bg bg-black/12 rounded-md px-1.5"
				onclick={copyToClipboard}
				title="Click to copy"
			>
				<span class="block font-light">{username}:</span>
				<span class="block">{repo}</span>
			</button>
			<!-- Tooltip that transitions between states -->
			<span
				class="absolute left-0 bottom-full mb-1 px-2 py-1 bg-bg-primary text-xs font-mono border rounded-sm pointer-events-none whitespace-nowrap z-10 transition-all duration-300 {showCopiedTooltip
					? 'text-success border-success/40 opacity-100'
					: 'text-text-primary border-border-default opacity-0 group-hover:opacity-100'}"
			>
				{showCopiedTooltip ? "Copied!" : "Click to copy"}
			</span>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			{#if docpack.stargazers_count !== undefined && docpack.stargazers_count > 0}
				<span class="text-text-tertiary text-xs flex items-center gap-1" title="GitHub stars">
					<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
					</svg>
					{docpack.stargazers_count}
				</span>
			{/if}
			<span class="text-text-tertiary text-xs whitespace-nowrap">
				{formatDate(docpack.updated_at)}
			</span>
			<span
				class="px-2 py-0.5 text-xs border rounded-sm font-mono {statusClasses}"
				title={statusConfig.description}
			>
				{statusConfig.label}
			</span>
		</div>
	</div>

	<div class="mb-2 bg-bg-primary/50 rounded-md p-2 flex-1">
		<div class="flex items-start justify-between gap-2">
			<span class="text-text-tertiary text-xs font-mono">Description:</span>
			{#if !isEditingDescription}
				<button
					onclick={startEditingDescription}
					class="text-xs underline text-primary hover:text-primary/80 font-mono transition-colors"
					title="Edit description"
				>
					Edit Desc.
				</button>
			{/if}
		</div>
		{#if isEditingDescription}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div onclick={(e) => e.stopPropagation()} class="mt-1">
				<textarea
					bind:value={editedDescription}
					class="w-full text-sm bg-bg-primary border border-border-default rounded-sm p-2 text-text-primary focus:outline-none focus:border-primary resize-none"
					rows="3"
					placeholder="Enter a description for this docpack..."
				></textarea>
				<div class="flex gap-2 mt-2">
					<button
						onclick={saveDescription}
						disabled={isSavingDescription}
						class="px-3 py-1 text-xs font-mono bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isSavingDescription ? "Saving..." : "Save"}
					</button>
					<button
						onclick={cancelEditingDescription}
						disabled={isSavingDescription}
						class="px-3 py-1 text-xs font-mono bg-bg-primary hover:bg-hover-bg text-text-secondary border border-border-default rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<p class="text-text-secondary text-sm line-clamp-2 mt-1">
				{docpack.description || "No description provided"}
			</p>
		{/if}
	</div>

	<div class="flex items-center justify-between gap-2 mt-3">
		{#if docpack.tracked_branch || docpack.commit_hash}
			<div class="text-xs font-mono text-text-tertiary flex items-center gap-1">
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l-7 7 7 7M15 5l7 7-7 7" transform="rotate(90 12 12)" />
				</svg>
				<span class="text-text-secondary">{docpack.tracked_branch || 'main'}</span>
				{#if docpack.commit_hash}
					<span class="text-text-tertiary">@</span>
					<span class="text-text-tertiary">{docpack.commit_hash.substring(0, 7)}</span>
				{/if}
			</div>
		{:else}
			<div></div>
		{/if}

		{#if docpack.status === "public" || docpack.status === "valid"}
			<a
				href="/docpacks/{docpack.id}"
				onclick={(e) => e.stopPropagation()}
				class="text-xs font-mono px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-sm transition-colors"
			>
				View Docs
			</a>
		{/if}
	</div>
</div>
