import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createJob, updateJobStatus } from "$lib/supabase";
import { triggerBuild } from "$lib/runpod";

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { repo, git_ref } = body;

    // Validate input
    if (!repo || typeof repo !== "string") {
      return json({ error: "Invalid or missing repo" }, { status: 400 });
    }

    if (!git_ref || typeof git_ref !== "string") {
      return json({ error: "Invalid or missing git_ref" }, { status: 400 });
    }

    // Create job in database with initial status 'pending'
    const job = await createJob({
      user_id: locals.user.id,
      repo,
      git_ref,
    });

    // Trigger RunPod build in the background
    // Don't await this to avoid blocking the response
    triggerBuild({
      job_id: job.id,
      repo,
      git_ref,
      token: locals.user.access_token,
    })
      .then(async () => {
        // Update job status to 'building' after successfully triggering
        await updateJobStatus(job.id, "building");
      })
      .catch(async (error) => {
        console.error("Failed to trigger RunPod build:", error);
        // Update job status to 'failed' if RunPod trigger fails
        await updateJobStatus(
          job.id,
          "failed",
          `Failed to trigger build: ${error.message}`,
        );
      });

    // Return job ID and initial status immediately
    return json(
      {
        job_id: job.id,
        status: job.status,
        created_at: job.created_at,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating job:", error);
    return json({ error: "Failed to create job" }, { status: 500 });
  }
};
