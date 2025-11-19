<script lang="ts">
    import { goto } from "$app/navigation";

    let saving = $state(false);
    let error = $state<string | null>(null);

    // Form fields
    let title = $state("");
    let slug = $state("");
    let date = $state(new Date().toISOString().split("T")[0]);
    let author = $state("Xander");
    let readTime = $state("5 min");
    let tagsInput = $state("");
    let description = $state("");
    let content = $state("");
    let coverImage = $state("");
    let published = $state(false);

    // Auto-generate slug from title
    function updateSlug() {
        if (!slug || slug === generateSlug(title.slice(0, -1))) {
            slug = generateSlug(title);
        }
    }

    function generateSlug(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
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

        try {
            const res = await fetch("/api/admin/blog", {
                method: "POST",
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

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create post");
            }

            // Navigate to edit page
            goto(`/admin/blog/${data.post.id}`);
        } catch (err: any) {
            error = err.message;
        } finally {
            saving = false;
        }
    }
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
            <h1 class="text-3xl font-bold text-text-primary">New Post</h1>
        </div>
    </div>

    {#if error}
        <div class="text-danger p-4 border border-danger/30 rounded mb-6">
            {error}
        </div>
    {/if}

    <div class="space-y-6">
        <!-- Title -->
        <div>
            <label for="title" class="block text-sm font-medium text-text-primary mb-1">
                Title *
            </label>
            <input
                id="title"
                type="text"
                bind:value={title}
                oninput={updateSlug}
                class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                placeholder="My Blog Post Title"
            />
        </div>

        <!-- Slug -->
        <div>
            <label for="slug" class="block text-sm font-medium text-text-primary mb-1">
                Slug *
            </label>
            <input
                id="slug"
                type="text"
                bind:value={slug}
                class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none font-mono text-sm"
                placeholder="my-blog-post-title"
            />
            <p class="text-xs text-text-secondary mt-1">
                URL: /blog/{slug || "..."}
            </p>
        </div>

        <!-- Date and Read Time -->
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="date" class="block text-sm font-medium text-text-primary mb-1">
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
                <label for="readTime" class="block text-sm font-medium text-text-primary mb-1">
                    Read Time
                </label>
                <input
                    id="readTime"
                    type="text"
                    bind:value={readTime}
                    class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                    placeholder="5 min"
                />
            </div>
        </div>

        <!-- Author -->
        <div>
            <label for="author" class="block text-sm font-medium text-text-primary mb-1">
                Author
            </label>
            <input
                id="author"
                type="text"
                bind:value={author}
                class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                placeholder="Xander"
            />
        </div>

        <!-- Tags -->
        <div>
            <label for="tags" class="block text-sm font-medium text-text-primary mb-1">
                Tags
            </label>
            <input
                id="tags"
                type="text"
                bind:value={tagsInput}
                class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                placeholder="rust, typescript, ai"
            />
            <p class="text-xs text-text-secondary mt-1">
                Comma-separated list of tags
            </p>
        </div>

        <!-- Description -->
        <div>
            <label for="description" class="block text-sm font-medium text-text-primary mb-1">
                Description
            </label>
            <textarea
                id="description"
                bind:value={description}
                rows="2"
                class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none resize-none"
                placeholder="A brief description for SEO and post previews..."
            ></textarea>
        </div>

        <!-- Cover Image -->
        <div>
            <label for="coverImage" class="block text-sm font-medium text-text-primary mb-1">
                Cover Image URL
            </label>
            <input
                id="coverImage"
                type="text"
                bind:value={coverImage}
                class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none"
                placeholder="https://..."
            />
        </div>

        <!-- Content -->
        <div>
            <label for="content" class="block text-sm font-medium text-text-primary mb-1">
                Content (Markdown)
            </label>
            <textarea
                id="content"
                bind:value={content}
                rows="20"
                class="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded focus:border-primary focus:outline-none font-mono text-sm resize-y"
                placeholder="## Introduction&#10;&#10;Write your blog post content here using Markdown..."
            ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-border-default">
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    bind:checked={published}
                    class="w-4 h-4"
                />
                <span class="text-sm text-text-primary">Publish immediately</span>
            </label>

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
                    {saving ? "Saving..." : "Create Post"}
                </button>
            </div>
        </div>
    </div>
</div>
