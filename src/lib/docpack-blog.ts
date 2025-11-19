/**
 * Docpack Blog Loader
 *
 * Loads blog posts from a .docpack file where articles are stored as symbols
 */

import AdmZip from "adm-zip";
import { readFile } from "fs/promises";
import { join } from "path";

interface Symbol {
  id: string;
  kind: string;
  file: string;
  line: number;
  signature: string;
  doc_id: string;
}

interface Documentation {
  symbol: string;
  summary: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returns: string;
  example: string;
  notes: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  readTime: string;
  tags: string[];
  description: string;
  content: string;
  coverImage?: string;
}

export class DocpackBlogLoader {
  private docpackPath: string;
  private symbols: Symbol[] | null = null;
  private docs: Map<string, Documentation> | null = null;

  constructor(docpackPath: string) {
    this.docpackPath = docpackPath;
  }

  async load() {
    try {
      const zip = new AdmZip(this.docpackPath);

      // Extract symbols and docs
      const symbolsEntry = zip.getEntry("symbols.json");
      const docsEntry = zip.getEntry("docs.json");

      if (!symbolsEntry || !docsEntry) {
        throw new Error("Invalid docpack: missing symbols.json or docs.json");
      }

      this.symbols = JSON.parse(symbolsEntry.getData().toString("utf8"));
      const docsArray: Documentation[] = JSON.parse(
        docsEntry.getData().toString("utf8"),
      );

      // Create docs map for quick lookup
      this.docs = new Map(docsArray.map((doc) => [doc.symbol, doc]));
    } catch (error) {
      console.error("Failed to load blog docpack:", error);
      this.symbols = [];
      this.docs = new Map();
    }
  }

  async getAllPosts(): Promise<BlogPost[]> {
    if (!this.symbols || !this.docs) {
      await this.load();
    }

    // Filter for article symbols
    const articleSymbols = (this.symbols || []).filter(
      (s) => s.kind === "article",
    );

    // Convert to blog posts
    const posts = articleSymbols
      .map((symbol) => {
        const doc = this.docs!.get(symbol.id);
        if (!doc) return null;

        return this.symbolToPost(symbol, doc);
      })
      .filter(Boolean) as BlogPost[];

    // Sort by date (newest first)
    posts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return posts;
  }

  async getPost(slug: string): Promise<BlogPost | null> {
    if (!this.symbols || !this.docs) {
      await this.load();
    }

    const symbol = (this.symbols || []).find(
      (s) => s.kind === "article" && s.id.endsWith(slug),
    );

    if (!symbol) return null;

    const doc = this.docs!.get(symbol.id);
    if (!doc) return null;

    return this.symbolToPost(symbol, doc);
  }

  private symbolToPost(symbol: Symbol, doc: Documentation): BlogPost {
    const getParam = (name: string) =>
      doc.parameters.find((p) => p.name === name)?.type || "";

    const slug = symbol.id.replace("blog/", "");

    return {
      slug,
      title: doc.summary,
      date: getParam("date"),
      author: getParam("author"),
      readTime: getParam("read_time") + " read",
      tags: getParam("tags")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      description: doc.example || doc.summary,
      content: doc.description,
      coverImage: getParam("cover_image") || undefined,
    };
  }
}

// Singleton instance
let blogLoader: DocpackBlogLoader | null = null;

export function getBlogLoader(): DocpackBlogLoader {
  if (!blogLoader) {
    // Look for docpack in static folder or data folder
    const docpackPath =
      process.env.BLOG_DOCPACK_PATH ||
      join(process.cwd(), "static", "xandwr_doctown_blog.docpack");
    blogLoader = new DocpackBlogLoader(docpackPath);
  }
  return blogLoader;
}
