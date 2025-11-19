<script lang="ts">
    import { marked } from 'marked';
    import type { PageData } from './$types';
    
    export let data: PageData;
    const { post } = data;
    
    // Render markdown to HTML
    const contentHtml = marked(post.content);
</script>

<svelte:head>
    <title>{post.title} - Doctown Blog</title>
    <meta name="description" content={post.description} />
</svelte:head>

<article class="max-w-3xl mx-auto px-4 py-12">
    <!-- Header -->
    <header class="mb-12">
        <a href="/blog" class="text-primary hover:underline mb-6 inline-block">
            ← Back to Blog
        </a>
        
        <h1 class="text-5xl font-bold text-text-primary mb-4">
            {post.title}
        </h1>
        
        <div class="flex items-center gap-4 text-text-secondary mb-4">
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
        
        {#if post.tags.length > 0}
            <div class="flex gap-2 flex-wrap">
                {#each post.tags as tag}
                    <span class="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {tag}
                    </span>
                {/each}
            </div>
        {/if}
    </header>

    <!-- Content -->
    <div class="prose prose-invert prose-lg max-w-none">
        {@html contentHtml}
    </div>
</article>

<style>
    .prose {
        color: var(--text-secondary);
    }
    
    .prose :global(h2) {
        color: var(--text-primary);
        font-size: 2rem;
        font-weight: 700;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--border-default);
        padding-bottom: 0.5rem;
    }
    
    .prose :global(h3) {
        color: var(--text-primary);
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 0.75rem;
    }
    
    .prose :global(p) {
        margin-bottom: 1.25rem;
        line-height: 1.75;
    }
    
    .prose :global(ul), .prose :global(ol) {
        margin-bottom: 1.25rem;
        padding-left: 1.5rem;
    }
    
    .prose :global(li) {
        margin-bottom: 0.5rem;
    }
    
    .prose :global(code) {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-default);
        border-radius: 0.25rem;
        padding: 0.125rem 0.375rem;
        font-size: 0.875em;
        color: var(--primary);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    
    .prose :global(pre) {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-default);
        border-radius: 0.5rem;
        padding: 1rem;
        overflow-x: auto;
        margin-bottom: 1.25rem;
    }
    
    .prose :global(pre code) {
        background: none;
        border: none;
        padding: 0;
        color: var(--text-primary);
    }
    
    .prose :global(a) {
        color: var(--primary);
        text-decoration: none;
    }
    
    .prose :global(a:hover) {
        text-decoration: underline;
    }
    
    .prose :global(strong) {
        color: var(--text-primary);
        font-weight: 600;
    }
    
    .prose :global(hr) {
        margin: 2rem 0;
        border: 0;
        border-top: 1px solid var(--border-default);
    }
    
    .prose :global(blockquote) {
        border-left: 4px solid var(--primary);
        padding-left: 1rem;
        font-style: italic;
        color: var(--text-secondary);
        margin: 1.5rem 0;
    }
</style>
