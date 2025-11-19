import { getBlogLoader } from "$lib/docpack-blog";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const blogLoader = getBlogLoader();
  const post = await blogLoader.getPost(params.slug);

  if (!post) {
    throw error(404, "Blog post not found");
  }

  return {
    post,
  };
};
