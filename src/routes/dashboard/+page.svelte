<script lang="ts">
	import UserHeader from "$lib/components/UserHeader.svelte";
	import DocpackCard from "$lib/components/DocpackCard.svelte";
	import DocpackConfigModal from "$lib/components/DocpackConfigModal.svelte";
	import BuildLogs from "$lib/components/BuildLogs.svelte";
	import RepoModal from "$lib/components/RepoModal.svelte";
	import type { Docpack, DocpackStatus } from "$lib/types";
	import { hasASTSupport, getLanguageTheme } from "$lib/languageSupport";

	interface GitHubRepo {
		id: number;
		name: string;
		full_name: string;
		description: string | null;
		html_url: string;
		private: boolean;
		updated_at: string;
		stargazers_count: number;
		language: string | null;
	}

	let { data }: { data: { user: any; repos: Promise<GitHubRepo[]> } } = $props();

	let docpacks = $state<Docpack[]>([]);
	let availableRepos = $state<GitHubRepo[]>([]);
	let selectedRepo = $state<GitHubRepo | null>(null);
	let selectedDocpack = $state<Docpack | null>(null);
	let showBuildLogs = $state(false);
	let buildLogsJobId = $state<string | null>(null);
	let showRepoListModal = $state(false);
	let hideUnsupportedRepos = $state(false);
	let docpackModalPosition = $state<{
		top: number;
		left: number;
		width: number;
	} | null>(null);
	let repoModalPosition = $state<{
		top: number;
		left: number;
		width: number;
	} | null>(null);

	function openRepoListModal() {
		showRepoListModal = true;
	}

	function closeRepoListModal() {
		showRepoListModal = false;
		selectedRepo = null;
	}

	function openDocpackModal(docpack: Docpack, event: MouseEvent) {
		// If docpack is building or pending, show logs instead
		if (docpack.status === 'building' || docpack.status === 'pending') {
			buildLogsJobId = docpack.id;
			showBuildLogs = true;
			return;
		}

		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();

		docpackModalPosition = {
			top: rect.top + window.scrollY,
			left: rect.left + window.scrollX,
			width: rect.width,
		};
		selectedDocpack = docpack;
	}

	function closeBuildLogs() {
		showBuildLogs = false;
		buildLogsJobId = null;
	}

	function closeDocpackModal() {
		selectedDocpack = null;
		docpackModalPosition = null;
	}

	function closeRepoModal() {
		selectedRepo = null;
		repoModalPosition = null;
	}

	function openRepoModal(repo: GitHubRepo, event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();

		repoModalPosition = {
			top: rect.top + window.scrollY,
			left: rect.left + window.scrollX,
			width: rect.width,
		};
		selectedRepo = repo;
	}

	async function createDocpack(repo: GitHubRepo, branch: string = 'main') {
		try {
			// Call the API to create a job
			const response = await fetch('/api/jobs/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					repo: repo.html_url,
					git_ref: branch,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('Failed to create job:', error);
				alert('Failed to create job: ' + (error.error || 'Unknown error'));
				return;
			}

			const { job_id, status } = await response.json();

			// Create a new docpack with "pending" status and job_id
			const newDocpack: Docpack = {
				id: job_id,
				name: repo.name,
				full_name: repo.full_name,
				description: repo.description || undefined,
				updated_at: repo.updated_at,
				status: status as any,
				repo_url: repo.html_url,
				is_private: repo.private,
				language: repo.language,
				file_url: null,
				tracked_branch: branch,
			};

			docpacks = [...docpacks, newDocpack];
			availableRepos = availableRepos.filter((r) => r.id !== repo.id);
			closeRepoListModal();
			closeRepoModal();

			// Start polling for job status
			pollJobStatus(job_id);
		} catch (error) {
			console.error('Error creating docpack:', error);
			alert('Failed to create docpack');
		}
	}

	// Map to track active polling intervals
	const pollingIntervals = new Map<string, number>();

	async function pollJobStatus(jobId: string) {
		// Don't start polling if already polling this job
		if (pollingIntervals.has(jobId)) {
			return;
		}

		const poll = async () => {
			try {
				const response = await fetch(`/api/jobs/status/${jobId}`);

				// If job doesn't exist (404), remove it from the list
				if (response.status === 404) {
					console.log(`Job ${jobId} no longer exists, removing from list`);

					// Stop polling
					const intervalId = pollingIntervals.get(jobId);
					if (intervalId) {
						clearInterval(intervalId);
						pollingIntervals.delete(jobId);
					}

					// Remove from docpacks list
					docpacks = docpacks.filter(d => d.id !== jobId);
					return;
				}

				if (!response.ok) {
					console.error('Failed to fetch job status');
					return;
				}

				const job = await response.json();

				// Update the docpack status
				docpacks = docpacks.map(d =>
					d.id === jobId ? { ...d, status: job.status } : d
				);

				// Stop polling if job is completed or failed
				if (job.status === 'completed' || job.status === 'failed') {
					const intervalId = pollingIntervals.get(jobId);
					if (intervalId) {
						clearInterval(intervalId);
						pollingIntervals.delete(jobId);
					}

					// If completed, refetch docpacks to get the actual docpack data with proper IDs
					if (job.status === 'completed') {
						// Remove the pending job entry (which had job_id as its id)
						docpacks = docpacks.filter(d => d.id !== jobId);
						// Fetch the new completed docpack
						await fetchDocpacks();
					}
				}
			} catch (error) {
				console.error('Error polling job status:', error);
			}
		};

		// Poll immediately
		await poll();

		// Then poll every 5 seconds
		const intervalId = window.setInterval(poll, 5000);
		pollingIntervals.set(jobId, intervalId);
	}

	async function fetchDocpacks() {
		try {
			const response = await fetch('/api/docpacks');
			if (response.ok) {
				const data = await response.json();
				docpacks = data.docpacks || [];

				// Start polling for any pending jobs
				docpacks.forEach(docpack => {
					if (docpack.status === 'pending' || docpack.status === 'building') {
						pollJobStatus(docpack.id);
					}
				});
			}
		} catch (error) {
			console.error('Error fetching docpacks:', error);
		}
	}

	// Fetch existing docpacks on mount
	$effect(() => {
		fetchDocpacks();
	});

	// Cleanup polling intervals when component is destroyed
	$effect(() => {
		return () => {
			pollingIntervals.forEach(intervalId => clearInterval(intervalId));
			pollingIntervals.clear();
		};
	});

	async function handleStatusUpdate(docpack: Docpack, newStatus: DocpackStatus) {
		try {
			// Determine the public value based on the new status
			const isPublic = newStatus === 'public';

			// Call the API to update the docpack
			const response = await fetch(`/api/docpacks/${docpack.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ public: isPublic }),
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('Failed to update docpack:', error);
				alert('Failed to update docpack: ' + (error.error || 'Unknown error'));
				return;
			}

			// Update the docpack status in the local state
			docpacks = docpacks.map(d =>
				d.id === docpack.id ? { ...d, status: newStatus } : d
			);
			closeDocpackModal();

			console.log(`Successfully updated ${docpack.name} to status: ${newStatus}`);
		} catch (error) {
			console.error('Error updating docpack:', error);
			alert('Failed to update docpack');
		}
	}

	async function handleCancelDocpack(docpack: Docpack) {
		// If the docpack is building or pending, cancel the job via API
		if (docpack.status === 'building' || docpack.status === 'pending') {
			try {
				const response = await fetch(`/api/jobs/${docpack.id}/cancel`, {
					method: 'POST',
				});

				if (!response.ok) {
					const error = await response.json();
					console.error('Failed to cancel job:', error);
					alert('Failed to cancel job: ' + (error.error || 'Unknown error'));
					return;
				}

				// Stop polling for this job
				const intervalId = pollingIntervals.get(docpack.id);
				if (intervalId) {
					clearInterval(intervalId);
					pollingIntervals.delete(docpack.id);
				}

				// Remove docpack from docpacks list
				docpacks = docpacks.filter(d => d.id !== docpack.id);

				// Find the original repo and add it back to available repos
				const repoData: GitHubRepo = {
					id: Date.now(), // Generate a new ID since we don't have the original
					name: docpack.name,
					full_name: docpack.full_name,
					description: docpack.description || null,
					html_url: docpack.repo_url,
					private: docpack.is_private || false,
					updated_at: docpack.updated_at,
					stargazers_count: 0,
					language: docpack.language || null,
				};

				availableRepos = [...availableRepos, repoData].sort((a, b) =>
					a.name.localeCompare(b.name)
				);

				closeDocpackModal();
				closeBuildLogs();

				console.log(`Cancelled and removed docpack: ${docpack.name}`);
			} catch (error) {
				console.error('Error cancelling job:', error);
				alert('Failed to cancel job');
			}
		} else {
			// For non-building docpacks, just remove them from the list
			docpacks = docpacks.filter(d => d.id !== docpack.id);

			// Find the original repo and add it back to available repos
			const repoData: GitHubRepo = {
				id: Date.now(),
				name: docpack.name,
				full_name: docpack.full_name,
				description: docpack.description || null,
				html_url: docpack.repo_url,
				private: docpack.is_private || false,
				updated_at: docpack.updated_at,
				stargazers_count: 0,
				language: docpack.language || null,
			};

			availableRepos = [...availableRepos, repoData].sort((a, b) =>
				a.name.localeCompare(b.name)
			);

			closeDocpackModal();

			console.log(`Cancelled and removed docpack: ${docpack.name}`);
		}
	}

	async function handleDeleteDocpack(docpack: Docpack) {
		try {
			const response = await fetch(`/api/docpacks/${docpack.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('Failed to delete docpack:', error);
				alert('Failed to delete docpack: ' + (error.error || 'Unknown error'));
				return;
			}

			// Remove from list
			docpacks = docpacks.filter(d => d.id !== docpack.id);
			closeDocpackModal();

			console.log(`Deleted docpack: ${docpack.name}`);
		} catch (error) {
			console.error('Error deleting docpack:', error);
			alert('Failed to delete docpack');
		}
	}
</script>

<div class="h-full p-8">
	<div class="max-w-5xl mx-auto h-full flex flex-col">
		<UserHeader user={data.user} />

		<div class="flex flex-col flex-1 min-h-0">
			<!-- Docpacks Section -->
			<div class="flex flex-col min-h-0">
				<div class="flex items-baseline gap-3 mb-6">
					<h2 class="text-2xl font-bold tracking-tight text-text-primary">docpacks</h2>
					<span class="text-sm text-text-tertiary font-mono"
						>// {docpacks.length}
						{docpacks.length === 1 ? "pack" : "packs"}</span
					>
					<button
						onclick={openRepoListModal}
						class="ml-auto px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-sm hover:bg-primary/20 hover:border-primary/50 transition-all font-mono text-sm"
					>
						Create Docpack
					</button>
				</div>
				{#if docpacks.length > 0}
					<div
						class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-bg-elevated scrollbar-track-transparent border border-border-default rounded-sm bg-bg-secondary/50"
					>
						<div class="space-y-3 p-4">
						{#each docpacks as docpack (docpack.id)}
							<button
								onclick={(e) => openDocpackModal(docpack, e)}
								class="w-full text-left"
							>
								<DocpackCard {docpack} />
							</button>
						{/each}
						</div>
					</div>
				{:else}
					<div
						class="bg-bg-secondary/50 border border-border-default rounded-sm p-8 text-center flex-1 flex flex-col items-center justify-center"
					>
						<p class="text-text-tertiary font-mono text-sm mb-2">
							[it's empty here...]
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Repo List Modal -->
{#if showRepoListModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				closeRepoListModal();
			}
		}}
		style="background-color: rgba(10, 10, 10, 0.7);"
	>
		<div class="bg-bg-secondary border border-border-strong rounded-md w-full max-w-3xl max-h-[80vh] flex flex-col">
			<!-- Header -->
			<div class="border-b border-border-default p-6">
				<div class="flex items-center justify-between gap-4">
					<div class="flex items-baseline gap-3">
						<h3 class="text-xl font-bold text-text-primary">Select Repository</h3>
						{#await data.repos then repos}
							{@const filtered = hideUnsupportedRepos ? repos.filter(r => hasASTSupport(r.language)) : repos}
							<span class="text-sm text-text-tertiary font-mono">
								// {filtered.length} {filtered.length === 1 ? 'repo' : 'repos'}
							</span>
						{/await}
					</div>
					<button
						onclick={() => hideUnsupportedRepos = !hideUnsupportedRepos}
						class="flex items-center gap-2 px-3 py-1.5 rounded-sm border font-mono text-xs transition-all {hideUnsupportedRepos ? 'bg-success/10 text-success border-success/30' : 'bg-bg-secondary border-border-default text-text-tertiary hover:border-border-strong hover:text-text-primary'}"
						title={hideUnsupportedRepos ? 'Show all repos' : 'Hide repos without AST support'}
					>
						<span>{hideUnsupportedRepos ? '✓' : '○'}</span>
						<span>AST only</span>
					</button>
				</div>
			</div>

			<!-- Repo List -->
			<div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-bg-elevated scrollbar-track-transparent">
				{#await data.repos}
					<div class="p-12 flex items-center justify-center">
						<div class="text-center">
							<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
							<p class="text-text-secondary font-mono text-sm">loading repositories...</p>
						</div>
					</div>
				{:then repos}
					{@const filteredRepos = hideUnsupportedRepos ? repos.filter(r => hasASTSupport(r.language)) : repos}
					{#if filteredRepos.length > 0}
						<div class="p-4 space-y-2">
							{#each filteredRepos as repo (repo.id)}
							{@const isSupported = hasASTSupport(repo.language)}
							{@const theme = getLanguageTheme(repo.language)}
							<button
								onclick={(e) => {
									availableRepos = repos;
									openRepoModal(repo, e);
								}}
								class="w-full text-left bg-bg-secondary/30 p-4 hover:bg-hover-bg transition-all border rounded-sm {repo.language ? `${theme.borderColor} ${theme.hoverBorderColor}` : 'border-border-default hover:border-border-strong'} {!isSupported && repo.language ? 'opacity-60' : ''}"
								>
									<div class="flex items-center gap-2 mb-2">
										<h4 class="text-base font-bold truncate flex-1 font-mono {isSupported ? 'text-text-primary' : 'text-text-tertiary'}">
											{repo.name}
										</h4>
									{#if isSupported && repo.language}
										<span class="px-2 py-0.5 text-xs bg-success/10 text-success border border-success/30 rounded-sm font-mono shrink-0" title="Full AST support available">
											✓ AST
										</span>
									{/if}
								{#if repo.private}
									<span class="px-2 py-0.5 text-xs bg-static/20 text-text-tertiary border border-static/50 rounded-sm font-mono shrink-0">
										Private
									</span>
									{:else}
										<span class="px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/30 rounded-sm font-mono shrink-0">
												Public
											</span>
										{/if}
									</div>
									{#if repo.description}
										<p class="text-xs mb-3 line-clamp-2 font-light {isSupported ? 'text-text-secondary' : 'text-text-tertiary/70'}">
											{repo.description}
										</p>
									{/if}
								<div class="flex items-center gap-3 text-xs font-mono {isSupported ? 'text-text-tertiary' : 'text-text-tertiary/50'}">
									{#if repo.language}
										<span class="flex items-center gap-1.5 {theme.textColor}">
											<span class="w-2 h-2 {theme.dotColor} {!isSupported ? 'opacity-50' : ''}"></span>
											{repo.language}
										</span>
									{/if}
									{#if repo.stargazers_count > 0}
										<span class="flex items-center gap-1">
											<span class="text-warning">★</span>
											{repo.stargazers_count}
										</span>
									{/if}
								</div>
								</button>
							{/each}
						</div>
					{:else}
						<div class="p-12 flex items-center justify-center">
							<div class="text-center">
								<p class="text-danger font-mono text-sm mb-2">
									{hideUnsupportedRepos ? 'No repos with AST support found' : 'No repositories found'}
								</p>
								{#if hideUnsupportedRepos}
									<button
										onclick={() => hideUnsupportedRepos = false}
										class="text-xs text-primary hover:underline font-mono"
									>
										Show all repos
									</button>
								{/if}
							</div>
						</div>
					{/if}
				{:catch}
					<div class="p-12 flex items-center justify-center">
						<p class="text-danger font-mono text-sm">Failed to load repositories</p>
					</div>
				{/await}
			</div>

			<!-- Footer -->
			<div class="border-t border-border-default p-4">
				<button
					onclick={closeRepoListModal}
					class="px-4 py-2 bg-bg-elevated/50 text-text-secondary border border-border-strong rounded-sm hover:bg-border-strong hover:text-text-primary transition-all font-mono text-sm"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<DocpackConfigModal
	docpack={selectedDocpack}
	position={docpackModalPosition}
	onClose={closeDocpackModal}
	onStatusUpdate={handleStatusUpdate}
	onCancel={handleCancelDocpack}
	onDelete={handleDeleteDocpack}
/>

{#if showBuildLogs && buildLogsJobId}
	<BuildLogs
		jobId={buildLogsJobId}
		onClose={closeBuildLogs}
		onCancel={() => {
			const docpack = docpacks.find(d => d.id === buildLogsJobId);
			if (docpack) {
				handleCancelDocpack(docpack);
			}
		}}
	/>
{/if}

<RepoModal
	repo={selectedRepo}
	position={repoModalPosition}
	onClose={closeRepoModal}
	onCreateDocpack={createDocpack}
/>
