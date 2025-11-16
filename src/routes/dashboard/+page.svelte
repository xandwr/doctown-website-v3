<script lang="ts">
	import UserHeader from "$lib/components/UserHeader.svelte";
	import RepoCard from "$lib/components/RepoCard.svelte";
	import RepoModal from "$lib/components/RepoModal.svelte";
	import DocpackCard from "$lib/components/DocpackCard.svelte";
	import DocpackConfigModal from "$lib/components/DocpackConfigModal.svelte";
	import type { Docpack, DocpackStatus } from "$lib/types";

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
	let repoModalPosition = $state<{
		top: number;
		left: number;
		width: number;
	} | null>(null);
	let docpackModalPosition = $state<{
		top: number;
		left: number;
		width: number;
	} | null>(null);

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

	function closeRepoModal() {
		selectedRepo = null;
		repoModalPosition = null;
	}

	function openDocpackModal(docpack: Docpack, event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();

		docpackModalPosition = {
			top: rect.top + window.scrollY,
			left: rect.left + window.scrollX,
			width: rect.width,
		};
		selectedDocpack = docpack;
	}

	function closeDocpackModal() {
		selectedDocpack = null;
		docpackModalPosition = null;
	}

	async function createDocpack(repo: GitHubRepo) {
		try {
			// Call the API to create a job
			const response = await fetch('/api/jobs/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					repo: repo.full_name,
					git_ref: 'main', // Default to main branch
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
				file_url: null
			};

			docpacks = [...docpacks, newDocpack];
			availableRepos = availableRepos.filter((r) => r.id !== repo.id);
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

	// Fetch existing docpacks on mount
	$effect(() => {
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

		fetchDocpacks();
	});

	// Cleanup polling intervals when component is destroyed
	$effect(() => {
		return () => {
			pollingIntervals.forEach(intervalId => clearInterval(intervalId));
			pollingIntervals.clear();
		};
	});

	function handleStatusUpdate(docpack: Docpack, newStatus: DocpackStatus) {
		// Update the docpack status
		docpacks = docpacks.map(d =>
			d.id === docpack.id ? { ...d, status: newStatus } : d
		);
		closeDocpackModal();

		// Placeholder for actual API call
		console.log(`Updated ${docpack.name} to status: ${newStatus}`);
	}

	function handleCancelDocpack(docpack: Docpack) {
		// Remove docpack from docpacks list
		docpacks = docpacks.filter(d => d.id !== docpack.id);

		// Find the original repo and add it back to available repos
		const repoId = parseInt(docpack.id.replace('docpack-', ''));
		const repoData: GitHubRepo = {
			id: repoId,
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

		// Placeholder for actual API call
		console.log(`Cancelled and removed docpack: ${docpack.name}`);
	}
</script>

<div class="h-full p-8">
	<div class="max-w-7xl mx-auto h-full flex flex-col">
		<UserHeader user={data.user} />

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
			<!-- Left Pane: Docpacks -->
			<div class="flex flex-col min-h-0">
				<div class="flex items-baseline gap-3 mb-6">
					<h2 class="text-2xl font-bold tracking-tight">docpacks</h2>
					<span class="text-sm text-emerald-400 font-mono"
						>// {docpacks.length}
						{docpacks.length === 1 ? "pack" : "packs"}</span
					>
				</div>
				{#if docpacks.length > 0}
					<div
						class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent border border-emerald-500/20 rounded-lg bg-black/30"
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
						class="bg-black/30 border border-emerald-500/20 rounded-lg p-8 text-center flex-1 flex flex-col items-center justify-center"
					>
						<div class="text-6xl mb-4">🚀</div>
						<p class="text-emerald-400/80 font-mono text-sm mb-2">
							nothing here yet
						</p>
						<p class="text-white/40 text-xs">
							but when there is, it'll be legendary
						</p>
					</div>
				{/if}
			</div>

			<!-- Right Pane: GitHub Repositories -->
			<div class="flex flex-col min-h-0">
				<div class="flex items-baseline gap-3 mb-6">
					<h2 class="text-2xl font-bold tracking-tight">
						repositories
					</h2>
					<span class="text-sm text-cyan-400 font-mono"
						>// {availableRepos.length} repos</span
					>
				</div>
				{#await data.repos}
					<div class="bg-black/30 border border-cyan-500/20 rounded-lg p-6 flex-1 flex items-center justify-center">
						<div class="text-center">
							<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
							<p class="text-cyan-400/80 font-mono text-sm">
								loading repositories...
							</p>
						</div>
					</div>
				{:then repos}
					{#if repos.length > 0}
						<div
							class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent border border-cyan-500/20 rounded-lg bg-black/30"
						>
							<div class="space-y-3 p-4">
							{#each repos as repo (repo.id)}
								<RepoCard
									{repo}
									onClick={(e) => {
										availableRepos = repos;
										openRepoModal(repo, e);
									}}
									isSelected={selectedRepo?.id === repo.id}
								/>
							{/each}
							</div>
						</div>
					{:else}
						<div class="bg-black/30 border border-cyan-500/20 rounded-lg p-6 flex-1 flex items-center justify-center">
							<p class="text-red-400/80 font-mono text-sm">
								No repositories found
							</p>
						</div>
					{/if}
				{:catch error}
					<div class="bg-black/30 border border-red-500/20 rounded-lg p-6 flex-1 flex items-center justify-center">
						<p class="text-red-400/80 font-mono text-sm">
							Failed to load repositories
						</p>
					</div>
				{/await}
			</div>
		</div>
	</div>
</div>

<RepoModal
	repo={selectedRepo}
	position={repoModalPosition}
	onClose={closeRepoModal}
	onCreateDocpack={createDocpack}
/>

<DocpackConfigModal
	docpack={selectedDocpack}
	position={docpackModalPosition}
	onClose={closeDocpackModal}
	onStatusUpdate={handleStatusUpdate}
	onCancel={handleCancelDocpack}
/>
