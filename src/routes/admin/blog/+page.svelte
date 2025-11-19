<script lang="ts">
    import { onMount } from "svelte";

    interface BlogPost {
        id: string;
        slug: string;
        title: string;
        date: string;
        author: string;
        read_time: string;
        tags: string[];
        description: string;
        published: boolean;
        created_at: string;
        updated_at: string;
    }

    let posts = $state<BlogPost[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let syncing = $state(false);
    let syncMessage = $state<string | null>(null);

    async function fetchPosts() {
        loading = true;
        error = null;

        try {
            const res = await fetch("/api/admin/blog");
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch posts");
            }

            posts = data.posts;
        } catch (err: any) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function deletePost(id: string, title: string) {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/blog/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete post");
            }

            // Remove from list
            posts = posts.filter((p) => p.id !== id);
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    }

    async function togglePublished(post: BlogPost) {
        try {
            const res = await fetch(`/api/admin/blog/${post.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: !post.published }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update post");
            }

            // Update in list
            const idx = posts.findIndex((p) => p.id === post.id);
            if (idx !== -1) {
                posts[idx] = { ...posts[idx], published: !post.published };
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    }

    async function syncToR2() {
        syncing = true;
        syncMessage = null;

        try {
            const res = await fetch("/api/admin/blog/sync", {
                method: "POST",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to sync");
            }

            syncMessage = data.message;
            setTimeout(() => (syncMessage = null), 5000);
        } catch (err: any) {
            alert(`Sync error: ${err.message}`);
        } finally {
            syncing = false;
        }
    }

    onMount(fetchPosts);
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h1 class="text-3xl font-bold text-text-primary">Blog Admin</h1>
            <p class="text-text-secondary mt-1">Manage blog posts</p>
        </div>
        <div class="flex items-center gap-3">
            <button
                onclick={syncToR2}
                disabled={syncing}
                class="px-4 py-2 border border-border-default rounded hover:bg-bg-elevated transition-colors disabled:opacity-50"
            >
                {syncing ? "Syncing..." : "Sync to R2"}
            </button>
            <a
                href="/admin/blog/new"
                class="px-4 py-2 bg-primary text-black font-medium rounded hover:bg-primary/80 transition-colors"
            >
                New Post
            </a>
        </div>
    </div>

    {#if syncMessage}
        <div class="text-success p-4 border border-success/30 rounded mb-6">
            {syncMessage}
        </div>
    {/if}

    {#if loading}
        <div class="text-text-secondary">Loading posts...</div>
    {:else if error}
        <div class="text-danger p-4 border border-danger/30 rounded">
            {error}
        </div>
    {:else if posts.length === 0}
        <div class="text-text-secondary text-center py-12">
            <p>No blog posts yet.</p>
            <a href="/admin/blog/new" class="text-primary hover:underline"
                >Create your first post</a
            >
        </div>
    {:else}
        <div class="space-y-4">
            {#each posts as post}
                <div
                    class="border border-border-default rounded-lg p-4 hover:border-border-strong transition-colors"
                >
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <h2
                                    class="text-lg font-semibold text-text-primary truncate"
                                >
                                    {post.title}
                                </h2>
                                {#if post.published}
                                    <span
                                        class="text-xs px-2 py-0.5 bg-success/20 text-success rounded"
                                    >
                                        Published
                                    </span>
                                {:else}
                                    <span
                                        class="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded"
                                    >
                                        Draft
                                    </span>
                                {/if}
                            </div>
                            <div
                                class="text-sm text-text-secondary flex items-center gap-3"
                            >
                                <span>{post.date}</span>
                                <span>/{post.slug}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                onclick={() => togglePublished(post)}
                                class="px-3 py-1 text-sm border border-border-default rounded hover:bg-bg-elevated transition-colors"
                            >
                                {post.published ? "Unpublish" : "Publish"}
                            </button>
                            <a
                                href="/admin/blog/{post.id}"
                                class="px-3 py-1 text-sm border border-border-default rounded hover:bg-bg-elevated transition-colors"
                            >
                                Edit
                            </a>
                            <button
                                onclick={() => deletePost(post.id, post.title)}
                                class="px-3 py-1 text-sm border border-danger/30 text-danger rounded hover:bg-danger/10 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
