import { getBlogLoader } from "$lib/docpack-blog";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const blogLoader = getBlogLoader();
  const posts = await blogLoader.getAllPosts();

  return {
    posts,
  };
};
