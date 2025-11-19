import { json, type RequestHandler } from "@sveltejs/kit";
import {
  getUserDocpacks,
  getPublicDocpacks,
  getUserPendingJobs,
} from "$lib/supabase";

export const GET: RequestHandler = async ({ locals, url }) => {
  const publicOnly = url.searchParams.get("public") === "true";

  try {
    if (publicOnly) {
      // Fetch public docpacks - no authentication required
      const docpacks = await getPublicDocpacks();
      return json({ docpacks });
    } else {
      // Fetch user's docpacks - authentication required
      if (!locals.user) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user has active subscription
      if (!locals.hasActiveSubscription) {
        return json({ error: "Active subscription required" }, { status: 403 });
      }

      // Get completed docpacks
      const docpacks = await getUserDocpacks(locals.user.id);

      // Get pending/building jobs and convert them to docpack format
      const pendingJobs = await getUserPendingJobs(locals.user.id);
      const pendingDocpacks = pendingJobs.map((job: any) => {
        // Extract repo name from URL
        const repoName = job.repo.split("/").pop() || "Unknown";
        const fullName = job.repo
          .replace("https://github.com/", "")
          .replace(".git", "");

        return {
          id: job.id,
          name: repoName,
          full_name: fullName,
          description: null,
          file_url: null,
          repo_url: job.repo,
          commit_hash: null,
          version: null,
          language: null,
          created_at: job.created_at,
          updated_at: job.updated_at,
          status: job.status,
          is_private: true,
          job_id: job.id,
        };
      });

      // Combine completed docpacks and pending jobs
      const allDocpacks = [...pendingDocpacks, ...docpacks];

      return json({ docpacks: allDocpacks });
    }
  } catch (error) {
    console.error("Error fetching docpacks:", error);
    return json({ error: "Failed to fetch docpacks" }, { status: 500 });
  }
};
