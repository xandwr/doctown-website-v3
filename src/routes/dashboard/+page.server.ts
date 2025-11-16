import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  updated_at: string;
  stargazers_count: number;
  language: string | null;
}

export const load: PageServerLoad = async ({ locals }) => {
  // Redirect to home if not authenticated
  if (!locals.user || !locals.accessToken) {
    throw redirect(303, "/");
  }

  // Return user immediately and stream repos asynchronously
  return {
    user: locals.user,
    repos: (async () => {
      // Fetch user's repositories asynchronously
      const reposResponse = await fetch(
        "https://api.github.com/user/repos?per_page=100&sort=updated",
        {
          headers: {
            Authorization: `Bearer ${locals.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      let repos: GitHubRepo[] = [];
      if (reposResponse.ok) {
        repos = await reposResponse.json();
      }

      return repos;
    })(),
  };
};
