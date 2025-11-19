<script lang="ts">
    import { onMount } from "svelte";
    import Prism from "prismjs";

    // Import common languages
    import "prismjs/components/prism-typescript";
    import "prismjs/components/prism-javascript";
    import "prismjs/components/prism-rust";
    import "prismjs/components/prism-python";
    import "prismjs/components/prism-go";
    import "prismjs/components/prism-c";
    import "prismjs/components/prism-cpp";
    import "prismjs/components/prism-java";
    import "prismjs/components/prism-json";
    import "prismjs/components/prism-bash";
    import "prismjs/components/prism-yaml";
    import "prismjs/components/prism-toml";

    interface Props {
        code: string;
        language?: string;
    }

    let { code, language = "typescript" }: Props = $props();
    let codeElement: HTMLElement;

    // Map common file extensions/languages to Prism language keys
    function normalizeLanguage(lang: string): string {
        const map: Record<string, string> = {
            'ts': 'typescript',
            'js': 'javascript',
            'rs': 'rust',
            'py': 'python',
            'rb': 'ruby',
            'sh': 'bash',
            'shell': 'bash',
            'yml': 'yaml',
        };
        return map[lang.toLowerCase()] || lang.toLowerCase();
    }

    onMount(() => {
        if (codeElement) {
            Prism.highlightElement(codeElement);
        }
    });

    $effect(() => {
        if (codeElement && code) {
            // Re-highlight when code changes
            codeElement.textContent = code;
            Prism.highlightElement(codeElement);
        }
    });
</script>

<pre class="code-block"><code bind:this={codeElement} class="language-{normalizeLanguage(language)}">{code}</code></pre>

<style>
    .code-block {
        margin: 0;
        padding: 0;
        background: transparent;
    }

    .code-block code {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 0.75rem;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    /* Custom theme matching the site's aesthetic */
    :global(.token.comment),
    :global(.token.prolog),
    :global(.token.doctype),
    :global(.token.cdata) {
        color: #6b7280;
    }

    :global(.token.punctuation) {
        color: #9ca3af;
    }

    :global(.token.property),
    :global(.token.tag),
    :global(.token.boolean),
    :global(.token.number),
    :global(.token.constant),
    :global(.token.symbol),
    :global(.token.deleted) {
        color: #f59e0b;
    }

    :global(.token.selector),
    :global(.token.attr-name),
    :global(.token.string),
    :global(.token.char),
    :global(.token.builtin),
    :global(.token.inserted) {
        color: #10b981;
    }

    :global(.token.operator),
    :global(.token.entity),
    :global(.token.url),
    :global(.language-css .token.string),
    :global(.style .token.string) {
        color: #d1d5db;
    }

    :global(.token.atrule),
    :global(.token.attr-value),
    :global(.token.keyword) {
        color: #f472b6;
    }

    :global(.token.function),
    :global(.token.class-name) {
        color: #60a5fa;
    }

    :global(.token.regex),
    :global(.token.important),
    :global(.token.variable) {
        color: #fbbf24;
    }
</style>
