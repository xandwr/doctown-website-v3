import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import AdmZip from "adm-zip";
import crypto from "crypto";

// Admin check helper
function isAdmin(user: any): boolean {
  const username = user?.login || user?.github_login;
  return username === "xandwr";
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  author: string;
  read_time: string;
  tags: string[];
  description: string;
  content: string;
  cover_image: string | null;
}

function createSymbol(post: BlogPost) {
  const id = `blog/${post.slug}`;
  return {
    id,
    kind: "article",
    file: `blog/${post.slug}.md`,
    line: 1,
    signature: `${post.date} | ${post.read_time} read | ${post.tags.join(", ")}`,
    doc_id: id,
  };
}

function createDocumentation(post: BlogPost) {
  return {
    symbol: `blog/${post.slug}`,
    summary: post.title,
    description: post.content,
    parameters: [
      { name: "author", type: post.author, description: "Post author" },
      { name: "date", type: post.date, description: "Publication date" },
      { name: "tags", type: post.tags.join(","), description: "Post tags" },
      {
        name: "read_time",
        type: post.read_time,
        description: "Estimated read time",
      },
      { name: "slug", type: post.slug, description: "URL slug" },
      ...(post.cover_image
        ? [
            {
              name: "cover_image",
              type: post.cover_image,
              description: "Cover image URL",
            },
          ]
        : []),
    ],
    returns: "",
    example: post.description || "",
    notes: [
      `seo_description: ${post.description}`,
      `canonical_url: https://doctown.dev/blog/${post.slug}`,
    ],
  };
}

/**
 * POST /api/admin/blog/sync - Generate and upload blog docpack from database
 */
export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user || !isAdmin(locals.user)) {
    return json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 },
    );
  }

  try {
    // Fetch all published posts
    const { data: posts, error: dbError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });

    if (dbError) {
      console.error("Failed to fetch blog posts:", dbError);
      return json({ error: "Failed to fetch blog posts" }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return json({ error: "No published posts to sync" }, { status: 400 });
    }

    // Generate symbols and documentation
    const symbols = posts.map(createSymbol);
    const docs = posts.map(createDocumentation);

    // Create manifest
    const manifest = {
      docpack_format: 1,
      project: {
        name: "xandwr_doctown_blog",
        version: "1.0.0",
        repo: "xandwr/doctown-v3",
        commit: crypto
          .createHash("sha256")
          .update(JSON.stringify(posts))
          .digest("hex")
          .slice(0, 8),
      },
      generated_at: new Date().toISOString(),
      language_summary: {
        markdown_files: posts.length,
      },
      stats: {
        symbols_extracted: symbols.length,
        docs_generated: docs.length,
      },
      public: true,
    };

    // Create ZIP archive
    const zip = new AdmZip();
    zip.addFile(
      "manifest.json",
      Buffer.from(JSON.stringify(manifest, null, 2)),
    );
    zip.addFile("symbols.json", Buffer.from(JSON.stringify(symbols, null, 2)));
    zip.addFile("docs.json", Buffer.from(JSON.stringify(docs, null, 2)));

    const zipBuffer = zip.toBuffer();

    // Upload to R2
    const accessKeyId = env.BUCKET_ACCESS_KEY_ID;
    const secretAccessKey = env.BUCKET_SECRET_ACCESS_KEY;
    const endpoint = env.BUCKET_S3_ENDPOINT;
    const bucketName = env.BUCKET_NAME || "doctown-central";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      return json({ error: "S3 credentials not configured" }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const key = "blog-posts/blog.docpack";

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: zipBuffer,
        ContentType: "application/zip",
      }),
    );

    return json({
      success: true,
      message: `Synced ${posts.length} posts to R2`,
      stats: {
        posts: posts.length,
        size: zipBuffer.length,
        path: key,
      },
    });
  } catch (error) {
    console.error("Error syncing blog docpack:", error);
    return json(
      {
        error: "Failed to sync blog docpack",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
