<script lang="ts">
    const metadata = {
        title: 'Building Doctown: Solving Documentation in a Week-Long Sprint',
        date: '2025-11-19',
        author: 'Xander',
        readTime: '8 min read'
    };
</script>

<svelte:head>
    <title>{metadata.title} - Doctown Blog</title>
    <meta name="description" content="How I built an AI-powered documentation system that costs pennies and delivers O(1) codebase understanding." />
</svelte:head>

<article class="max-w-3xl mx-auto px-4 py-12">
    <!-- Header -->
    <header class="mb-12">
        <a href="/blog" class="text-primary hover:underline mb-6 inline-block">
            ← Back to Blog
        </a>
        
        <h1 class="text-5xl font-bold text-text-primary mb-4">
            {metadata.title}
        </h1>
        
        <div class="flex items-center gap-4 text-text-secondary">
            <time datetime={metadata.date}>
                {new Date(metadata.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}
            </time>
            <span>•</span>
            <span>{metadata.readTime}</span>
        </div>
    </header>

    <!-- Content -->
    <div class="prose prose-invert prose-lg max-w-none">
        <h2>The Problem</h2>
        <p>
            Documentation sucks. It's either outdated, incomplete, or buried in a README that nobody reads. 
            For AI agents and developers alike, understanding a codebase means grepping through files, 
            reading source code, and piecing together context from comments and naming conventions.
        </p>
        
        <p>
            I wanted something better: <strong>O(1) access to any symbol's documentation</strong>. 
            No searching. No guessing. Just instant, accurate, AI-generated docs that follow you anywhere.
        </p>

        <h2>The Goal: "npm for docs"</h2>
        <p>
            The initial vision was simple: what if documentation worked like npm packages? You could:
        </p>
        <ul>
            <li><code>localdoc install xandwr:myproject</code> - Download docs</li>
            <li><code>localdoc query xandwr:myproject symbol "function_name"</code> - Get instant documentation</li>
            <li><code>localdoc search "rust http server"</code> - Find relevant packages</li>
        </ul>
        
        <p>
            But the real innovation wasn't the CLI—it was the <strong>docpack format</strong> and the 
            <strong>AI-powered generation pipeline</strong> that made it possible.
        </p>

        <h2>The Architecture</h2>
        
        <h3>1. The Builder Pipeline (Rust)</h3>
        <p>
            The builder is a Rust service that takes a GitHub repository and produces a 
            <code>.docpack</code> file. Here's what happens:
        </p>
        
        <ol>
            <li><strong>Ingest</strong>: Clone the repo, parse source files using tree-sitter</li>
            <li><strong>Extract</strong>: Pull out every symbol (functions, classes, methods, etc.)</li>
            <li><strong>Generate</strong>: Use an LLM to generate documentation for each symbol</li>
            <li><strong>Pack</strong>: Bundle everything into a compressed docpack file</li>
        </ol>

        <p>
            The entire pipeline runs on RunPod serverless CPUs. 
        </p>

        <h3>2. The Docpack Format</h3>
        <p>
            A docpack is essentially a ZIP file containing:
        </p>
        <ul>
            <li><code>manifest.json</code> - Metadata about the project</li>
            <li><code>symbols.json</code> - Every extracted symbol with its documentation</li>
            <li><code>embeddings.bin</code> (optional) - Vector embeddings for semantic search</li>
        </ul>

        <p>
            This format is <strong>portable</strong>, <strong>offline-first</strong>, and 
            <strong>version-controlled</strong>. You can share docpacks like any other file.
        </p>

        <h3>3. The CLI (Rust)</h3>
        <p>
            The CLI tool (<code>localdoc</code>) is a single binary that:
        </p>
        <ul>
            <li>Downloads docpacks from doctown.dev</li>
            <li>Stores them locally in <code>~/.local/share/localdoc/packages/</code></li>
            <li>Queries symbols instantly (no network needed after install)</li>
            <li>Serves as an MCP server for AI agents</li>
        </ul>

        <h3>4. The Web Platform (SvelteKit + Supabase)</h3>
        <p>
            The website provides:
        </p>
        <ul>
            <li><strong>Commons</strong>: Browse public docpacks</li>
            <li><strong>Dashboard</strong>: Generate docpacks for your private repos</li>
            <li><strong>Docs Viewer</strong>: Web UI for browsing documentation</li>
            <li><strong>Stripe Integration</strong>: Subscription management for premium features</li>
        </ul>

        <h2>The AI Magic</h2>
        <p>
            The documentation generation uses a few tricks to keep quality high and costs low:
        </p>
        
        <ol>
            <li>
                <strong>Context-aware prompts</strong>: Each symbol gets documentation generated 
                with full file context, not just the function signature
            </li>
            <li>
                <strong>Structured output</strong>: Docs follow a consistent format 
                (Summary, Description, Parameters, Returns, Examples, Notes)
            </li>
            <li>
                <strong>Batch processing</strong>: Process multiple symbols in parallel to maximize GPU utilization
            </li>
            <li>
                <strong>Caching</strong>: Reuse docs for unchanged symbols across versions
            </li>
        </ol>

        <h2>The Numbers</h2>
        <p>Here's what I learned after processing dozens of codebases:</p>
        
        <ul>
            <li><strong>Cost</strong>: ~$0.10-$0.50 per codebase (depending on size)</li>
            <li><strong>Speed</strong>: 5-15 minutes for a medium-sized project</li>
            <li><strong>Quality</strong>: 90%+ of generated docs are useful without editing</li>
            <li><strong>CLI size</strong>: ~8MB binary (Rust is efficient)</li>
        </ul>

        <h2>Challenges & Solutions</h2>
        
        <h3>Challenge 1: Parsing Multiple Languages</h3>
        <p>
            <strong>Solution</strong>: Use tree-sitter for language-agnostic parsing. 
            It handles Rust, TypeScript, Python, Go, and more with the same API.
        </p>

        <h3>Challenge 2: LLM Hallucinations</h3>
        <p>
            <strong>Solution</strong>: Always include the actual source code in the prompt. 
            The model can't hallucinate what's right in front of it.
        </p>

        <h3>Challenge 3: Storage & Distribution</h3>
        <p>
            <strong>Solution</strong>: Store docpacks in S3, distribute via signed URLs. 
            Public docpacks are cached globally on Vercel's edge network.
        </p>

        <h2>What's Next</h2>
        <p>The core product is shipping, but there's more to build:</p>
        
        <ul>
            <li><strong>Team features</strong>: Share private docpacks across organizations</li>
            <li><strong>CI/CD integration</strong>: Auto-generate docs on every commit</li>
            <li><strong>More languages</strong>: Java, C++ (properly), Ruby support</li>
            <li><strong>Analytics</strong>: Show which symbols are most queried</li>
        </ul>

        <h2>Try It Yourself</h2>
        <p>Install the CLI and test it out:</p>
        
        <pre><code>cargo install localdoc
localdoc search rust
localdoc install xandwr:localdoc
localdoc query xandwr:localdoc symbols</code></pre>

        <p>
            The entire project—from idea to working product—took one week of intense coding. 
            Five consecutive all-nighters, a lot of coffee (Monster Ultra White), and the belief that good tools 
            should be fast, cheap, and actually useful (here's hoping 🙏).
        </p>

        <p>
            If you're building something and want automatic documentation, 
            <a href="https://www.doctown.dev" class="text-primary hover:underline">check it out!</a>.
        </p>

        <hr class="my-8 border-border-default" />

        <p class="text-text-secondary text-sm italic">
            Questions? Feedback? Find me on GitHub 
            <a href="https://github.com/xandwr" class="text-primary hover:underline">@xandwr</a> <br />
            Or... xandwrp at gmail dot com
        </p>
    </div>
</article>

<style>
    .prose {
        color: var(--text-secondary);
    }
    
    .prose h2 {
        color: var(--text-primary);
        font-size: 2rem;
        font-weight: 700;
        margin-top: 2.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--border-default);
        padding-bottom: 0.5rem;
    }
    
    .prose h3 {
        color: var(--text-primary);
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2rem;
        margin-bottom: 0.75rem;
    }
    
    .prose p {
        margin-bottom: 1.25rem;
        line-height: 1.75;
    }
    
    .prose ul, .prose ol {
        margin-bottom: 1.25rem;
        padding-left: 1.5rem;
    }
    
    .prose li {
        margin-bottom: 0.5rem;
    }
    
    .prose code {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-default);
        border-radius: 0.25rem;
        padding: 0.125rem 0.375rem;
        font-size: 0.875em;
        color: var(--primary);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
    
    .prose pre {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-default);
        border-radius: 0.5rem;
        padding: 1rem;
        overflow-x: auto;
        margin-bottom: 1.25rem;
    }
    
    .prose pre code {
        background: none;
        border: none;
        padding: 0;
        color: var(--text-primary);
    }
    
    .prose a {
        color: var(--primary);
        text-decoration: none;
    }
    
    .prose a:hover {
        text-decoration: underline;
    }
    
    .prose strong {
        color: var(--text-primary);
        font-weight: 600;
    }
</style>
