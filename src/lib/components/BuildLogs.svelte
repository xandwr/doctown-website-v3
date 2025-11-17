<script lang="ts">
	import { onMount } from 'svelte';
	import { createClient } from '@supabase/supabase-js';
	import { page } from '$app/stores';
	import type { JobLog } from '$lib/supabase';

	interface BuildLogsProps {
		jobId: string;
		onClose?: () => void;
	}

	let { jobId, onClose }: BuildLogsProps = $props();

	let logs = $state<JobLog[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let logsContainer: HTMLDivElement;
	let autoScroll = $state(true);

	// Create a client-side Supabase client for realtime subscriptions
	const supabaseConfig = $page.data.supabase;
	const supabase = createClient(supabaseConfig.url, supabaseConfig.key, {
		realtime: {
			params: {
				eventsPerSecond: 10,
			},
		},
	});

	async function fetchInitialLogs() {
		try {
			const response = await fetch(`/api/jobs/${jobId}/logs`);
			if (response.ok) {
				const data = await response.json();
				logs = data.logs || [];
			} else {
				error = 'Failed to load logs';
			}
		} catch (err) {
			console.error('Error fetching logs:', err);
			error = 'Failed to load logs';
		} finally {
			isLoading = false;
		}
	}

	function scrollToBottom() {
		if (autoScroll && logsContainer) {
			logsContainer.scrollTop = logsContainer.scrollHeight;
		}
	}

	function handleScroll() {
		if (logsContainer) {
			const isAtBottom =
				logsContainer.scrollHeight - logsContainer.scrollTop <=
				logsContainer.clientHeight + 50;
			autoScroll = isAtBottom;
		}
	}

	function getLevelColor(level: string) {
		switch (level) {
			case 'error':
				return 'text-red-400';
			case 'warning':
				return 'text-yellow-400';
			case 'debug':
				return 'text-gray-400';
			case 'info':
			default:
				return 'text-emerald-400';
		}
	}

	function formatTimestamp(timestamp: string) {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3
		});
	}

	$effect(() => {
		scrollToBottom();
	});

	onMount(() => {
		// Fetch initial logs
		fetchInitialLogs();

		// Subscribe to new logs
		const channel = supabase
			.channel(`job_logs:${jobId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'job_logs',
					filter: `job_id=eq.${jobId}`
				},
				(payload) => {
					logs = [...logs, payload.new as JobLog];
				}
			)
			.subscribe();

		// Cleanup on unmount
		return () => {
			supabase.removeChannel(channel);
		};
	});
</script>

<div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
	<div class="bg-black border border-emerald-500/30 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-emerald-500/30">
			<div class="flex items-center gap-3">
				<div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
				<h2 class="text-lg font-bold text-emerald-400 font-mono">Build Logs</h2>
				<span class="text-xs text-white/50 font-mono">{jobId.slice(0, 8)}</span>
			</div>
			<button
				onclick={onClose}
				class="text-white/50 hover:text-white transition-colors"
				aria-label="Close logs"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Logs Content -->
		<div
			bind:this={logsContainer}
			onscroll={handleScroll}
			class="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black/50 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent"
		>
			{#if isLoading}
				<div class="flex items-center justify-center h-full">
					<div class="text-emerald-400/70">Loading logs...</div>
				</div>
			{:else if error}
				<div class="flex items-center justify-center h-full">
					<div class="text-red-400">{error}</div>
				</div>
			{:else if logs.length === 0}
				<div class="flex items-center justify-center h-full">
					<div class="text-white/40">No logs yet. Waiting for build to start...</div>
				</div>
			{:else}
				{#each logs as log (log.id)}
					<div class="flex gap-3 mb-1 hover:bg-white/5 px-2 py-1 rounded transition-colors">
						<span class="text-white/40 select-none shrink-0">{formatTimestamp(log.timestamp)}</span>
						<span class={`${getLevelColor(log.level)} font-bold uppercase select-none w-16 shrink-0`}>
							{log.level}
						</span>
						<span class="text-white/90 whitespace-pre-wrap break-all">{log.message}</span>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer with auto-scroll indicator -->
		<div class="p-2 border-t border-emerald-500/30 flex items-center justify-between text-xs">
			<div class="text-white/40 font-mono">
				{logs.length} {logs.length === 1 ? 'line' : 'lines'}
			</div>
			<button
				onclick={() => { autoScroll = true; scrollToBottom(); }}
				class={`font-mono px-2 py-1 rounded transition-colors ${
					autoScroll
						? 'text-emerald-400 bg-emerald-400/10'
						: 'text-white/40 hover:text-white/70'
				}`}
			>
				{autoScroll ? '● Auto-scroll ON' : '○ Auto-scroll OFF'}
			</button>
		</div>
	</div>
</div>
