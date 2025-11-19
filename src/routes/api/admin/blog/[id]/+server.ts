import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";

// Admin check helper
function isAdmin(user: any): boolean {
  const username = user?.login || user?.github_login;
  return username === "xandwr";
}

/**
 * GET /api/admin/blog/[id] - Get a single blog post by ID
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user || !isAdmin(locals.user)) {
    return json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 },
    );
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return json({ error: "Blog post not found" }, { status: 404 });
    }
    console.error("Failed to fetch blog post:", error);
    return json({ error: "Failed to fetch blog post" }, { status: 500 });
  }

  return json({ post });
};

/**
 * PUT /api/admin/blog/[id] - Update a blog post
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
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

    // Validate slug format if provided
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      return json(
        { error: "slug must be lowercase alphanumeric with hyphens only" },
        { status: 400 },
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    if (slug !== undefined) updates.slug = slug;
    if (title !== undefined) updates.title = title;
    if (date !== undefined) updates.date = date;
    if (author !== undefined) updates.author = author;
    if (read_time !== undefined) updates.read_time = read_time;
    if (tags !== undefined) updates.tags = tags;
    if (description !== undefined) updates.description = description;
    if (content !== undefined) updates.content = content;
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (published !== undefined) updates.published = published;

    if (Object.keys(updates).length === 0) {
      return json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return json({ error: "Blog post not found" }, { status: 404 });
      }
      if (error.code === "23505") {
        return json(
          { error: "A post with this slug already exists" },
          { status: 409 },
        );
      }
      console.error("Failed to update blog post:", error);
      return json({ error: "Failed to update blog post" }, { status: 500 });
    }

    return json({ post });
  } catch (err) {
    console.error("Error updating blog post:", err);
    return json({ error: "Invalid request body" }, { status: 400 });
  }
};

/**
 * DELETE /api/admin/blog/[id] - Delete a blog post
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user || !isAdmin(locals.user)) {
    return json(
      { error: "Unauthorized - Admin access required" },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Failed to delete blog post:", error);
    return json({ error: "Failed to delete blog post" }, { status: 500 });
  }

  return json({ success: true });
};
