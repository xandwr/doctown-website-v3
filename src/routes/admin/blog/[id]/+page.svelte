<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import type { PageData } from "./$types";

    export let data: PageData;

    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    // Form fields
    let id = $state("");
    let title = $state("");
    let slug = $state("");
    let date = $state("");
    let author = $state("");
    let readTime = $state("");
    let tagsInput = $state("");
    let description = $state("");
    let content = $state("");
    let coverImage = $state("");
    let published = $state(false);

    async function fetchPost() {
        loading = true;
        error = null;

        try {
            const res = await fetch(`/api/admin/blog/${data.postId}`);
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Failed to fetch post");
            }

            const post = result.post;
            id = post.id;
            title = post.title;
            slug = post.slug;
            date = post.date;
            author = post.author;
            readTime = post.read_time;
            tagsInput = (post.tags || []).join(", ");
            description = post.description || "";
            content = post.content || "";
            coverImage = post.cover_image || "";
            published = post.published;
        } catch (err: any) {
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function save() {
        if (!title.trim()) {
            error = "Title is required";
            return;
        }
        if (!slug.trim()) {
            error = "Slug is required";
            return;
        }

        saving = true;
        error = null;
        success = null;

        try {
            const res = await fetch(`/api/admin/blog/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    slug: slug.trim(),
                    date,
                    author: author.trim() || "Xander",
                    read_time: readTime.trim() || "5 min",
                    tags: tagsInput
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    description: description.trim(),
                    content: content,
                    cover_image: coverImage.trim() || null,
                    published,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Failed to save post");
            }

            success = "Post saved successfully!";
            setTimeout(() => (success = null), 3000);
        } catch (err: any) {
            error = err.message;
        } finally {
            saving = false;
        }
    }

    async function deletePost() {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/blog/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || "Failed to delete post");
            }

            goto("/admin/blog");
        } catch (err: any) {
            error = err.message;
        }
    }

    onMount(fetchPost);
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
        <div>
            <a
                href="/admin/blog"
                class="text-text-secondary hover:text-text-primary mb-2 inline-block"
            >
                &larr; Back to posts
            </a>
            <h1 class="text-3xl font-bold text-text-primary">Edit Post</h1>
        </div>
        {#if !loading && slug}
            <a
                href="/blog/{slug}"
                target="_blank"
                class="text-sm text-text-secondary hover:text-primary"
            >
                View post &rarr;
            </a>
        {/if}
    </div>

    {#if loading}
        <div class="text-text-secondary">Loading post...</div>
    {:else if error && !title}
        <div class="text-danger p-4 border border-danger/30 rounded">
            {error}
        </div>
    {:else}
        {#if error}
            <div class="text-danger p-4 border border-danger/30 rounded mb-6">
                {error}
            </div>
        {/if}

        {#if success}
            <div class="text-success p-4 border border-success/30 rounded mb-6">
                {success}
            </div>
        {/if}

        <div class="space-y-6">
            <!-- Title -->
            <div>
                <label
                    for="title"
                    class="block text-sm font-medium text-text-primary mb-1"
                >
                    Title *
                </label>
                <input
                    id="title"
                    type="text"
                    bind:value={title}
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                />
            </div>

            <!-- Slug -->
            <div>
                <label
                    for="slug"
                    class="block text-sm font-medium text-text-primary mb-1"
                >
                    Slug *
                </label>
                <input
                    id="slug"
                    type="text"
                    bind:value={slug}
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none font-mono text-sm"
                />
                <p class="text-xs text-text-secondary mt-1">
                    URL: /blog/{slug || "..."}
                </p>
            </div>

            <!-- Date and Read Time -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        for="date"
                        class="block text-sm font-medium text-text-primary mb-1"
                    >
                        Date
                    </label>
                    <input
                        id="date"
                        type="date"
                        bind:value={date}
                        class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                    />
                </div>
                <div>
                    <label
                        for="readTime"
                        class="block text-sm font-medium text-text-primary mb-1"
                    >
                        Read Time
                    </label>
                    <input
                        id="readTime"
                        type="text"
                        bind:value={readTime}
                        class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                    />
                </div>
            </div>

            <!-- Author -->
            <div>
                <label
                    for="author"
                    class="block text-sm font-medium text-text-primary mb-1"
                >
                    Author
                </label>
                <input
                    id="author"
                    type="text"
                    bind:value={author}
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                />
            </div>

            <!-- Tags -->
            <div>
                <label
                    for="tags"
                    class="block text-sm font-medium text-text-primary mb-1"
                >
                    Tags
                </label>
                <input
                    id="tags"
                    type="text"
                    bind:value={tagsInput}
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                />
                <p class="text-xs text-text-secondary mt-1">
                    Comma-separated list of tags
                </p>
            </div>

            <!-- Description -->
            <div>
                <label
                    for="description"
                    class="block text-sm font-medium text-text-primary mb-1"
                >
                    Description
                </label>
                <textarea
                    id="description"
                    bind:value={description}
                    rows="2"
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none resize-none"
                ></textarea>
            </div>

            <!-- Cover Image -->
            <div>
                <label
                    for="coverImage"
                    class="block text-sm font-medium text-text-primary mb-1"
                >
                    Cover Image URL
                </label>
                <input
                    id="coverImage"
                    type="text"
                    bind:value={coverImage}
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                />
            </div>

            <!-- Content -->
            <div>
                <label
                    for="content"
                    class="block text-sm font-medium text-text-primary mb-1"
                >
                    Content (Markdown)
                </label>
                <textarea
                    id="content"
                    bind:value={content}
                    rows="20"
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none font-mono text-sm resize-y"
                ></textarea>
            </div>

            <!-- Actions -->
            <div
                class="flex items-center justify-between pt-4 border-t border-border-default"
            >
                <div class="flex items-center gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={published}
                            class="w-4 h-4"
                        />
                        <span class="text-sm text-text-primary">Published</span>
                    </label>
                    <button
                        onclick={deletePost}
                        class="text-sm text-danger hover:underline"
                    >
                        Delete post
                    </button>
                </div>

                <div class="flex items-center gap-3">
                    <a
                        href="/admin/blog"
                        class="px-4 py-2 border border-border-default rounded hover:bg-bg-elevated transition-colors"
                    >
                        Cancel
                    </a>
                    <button
                        onclick={save}
                        disabled={saving}
                        class="px-4 py-2 bg-primary text-black font-medium rounded hover:bg-primary/80 transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
