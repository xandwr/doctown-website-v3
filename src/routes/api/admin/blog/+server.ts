import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";

// Admin check helper
function isAdmin(user: any): boolean {
  const username = user?.github_login;
  return username === "xandwr";
}

/**
 * GET /api/admin/blog - List all blog posts (including unpublished)
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user || !isAdmin(locals.user)) {
    return json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 },
    );
  }

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Failed to fetch blog posts:", error);
    return json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }

  return json({ posts });
};

/**
 * POST /api/admin/blog - Create a new blog post
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user || !isAdmin(locals.user)) {
    return json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const {
      slug,
      title,
      date,
      author,
      read_time,
      tags,
      description,
      content,
      cover_image,
      published,
    } = body;

    if (!slug || !title) {
      return json({ error: "slug and title are required" }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return json(
        { error: "slug must be lowercase alphanumeric with hyphens only" },
        { status: 400 },
      );
    }

    const { data: post, error } = await (supabase.from("blog_posts") as any)
      .insert({
        slug,
        title,
        date: date || new Date().toISOString().split("T")[0],
        author: author || "Xander",
        read_time: read_time || "5 min",
        tags: tags || [],
        description: description || "",
        content: content || "",
        cover_image: cover_image || null,
        published: published || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create blog post:", error);
      if (error.code === "23505") {
        return json(
          { error: "A post with this slug already exists" },
          { status: 409 },
        );
      }
      return json({ error: "Failed to create blog post" }, { status: 500 });
    }

    return json({ post }, { status: 201 });
  } catch (err) {
    console.error("Error creating blog post:", err);
    return json({ error: "Invalid request body" }, { status: 400 });
  }
};
