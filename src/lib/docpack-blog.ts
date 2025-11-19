/**
 * Blog Loader
 *
 * Loads blog posts from the database
 */

import { supabase } from "./supabase";

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

interface DbBlogPost {
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
  published: boolean;
  created_at: string;
  updated_at: string;
}

function dbPostToBlogPost(dbPost: DbBlogPost): BlogPost {
  return {
    slug: dbPost.slug,
    title: dbPost.title,
    date: dbPost.date,
    author: dbPost.author,
    readTime: dbPost.read_time + " read",
    tags: dbPost.tags || [],
    description: dbPost.description,
    content: dbPost.content,
    coverImage: dbPost.cover_image || undefined,
  };
}

export class DatabaseBlogLoader {
  async getAllPosts(): Promise<BlogPost[]> {
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });

    if (error) {
      console.error("Failed to fetch blog posts from database:", error);
      return [];
    }

    return (posts || []).map(dbPostToBlogPost);
  }

  async getPost(slug: string): Promise<BlogPost | null> {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("Failed to fetch blog post from database:", error);
      }
      return null;
    }

    return dbPostToBlogPost(post);
  }
}

// Singleton instance
let blogLoader: DatabaseBlogLoader | null = null;

export function getBlogLoader(): DatabaseBlogLoader {
  if (!blogLoader) {
    blogLoader = new DatabaseBlogLoader();
  }
  return blogLoader;
}
