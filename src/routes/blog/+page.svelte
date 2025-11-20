<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    const isAdmin = $derived(data.userRole === "admin");
</script>

<div class="max-w-4xl mx-auto px-4 py-12">
    <div class="flex items-center justify-between mb-4">
        <h1 class="text-5xl font-bold text-text-primary">Blog</h1>
        {#if isAdmin}
            <a
                href="/admin/blog"
                class="px-4 py-2 bg-danger/20 border border-danger text-danger rounded-sm hover:bg-danger/30 transition-colors font-medium"
            >
                Admin Panel
            </a>
        {/if}
    </div>
    <p class="text-text-secondary text-xl mb-12">Technical writeups and project updates</p>

    <div class="space-y-8">
        {#each data.posts as post}
            <a 
                href="/blog/{post.slug}"
                class="block border border-border-default rounded-lg p-6 hover:border-primary transition-colors"
            >
                <div class="flex items-center gap-4 text-sm text-text-secondary mb-3">
                    <time datetime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </time>
                    <span>•</span>
                    <span>{post.readTime}</span>
                </div>
                
                <h2 class="text-2xl font-semibold text-text-primary mb-2 group-hover:text-primary">
                    {post.title}
                </h2>
                
                <p class="text-text-secondary">
                    {post.description}
                </p>
            </a>
        {/each}
    </div>
</div>
