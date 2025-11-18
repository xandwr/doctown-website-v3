import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";

export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const docpackId = params.id;

  if (!docpackId) {
    return json({ error: "Missing docpack ID" }, { status: 400 });
  }

  try {
    // First, verify the docpack belongs to the user
    const { data: docpack, error: fetchError } = await supabase
      .from("docpacks")
      .select("*, jobs!inner(user_id)")
      .eq("id", docpackId)
      .eq("jobs.user_id", locals.user.id)
      .single();

    if (fetchError || !docpack) {
      return json(
        { error: "Docpack not found or unauthorized" },
        { status: 404 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { public: isPublic } = body;

    if (typeof isPublic !== "boolean") {
      return json(
        { error: "Invalid request: 'public' field must be a boolean" },
        { status: 400 },
      );
    }

    // Update the docpack
    const { data: updatedDocpack, error: updateError } = await (
      supabase.from("docpacks") as any
    )
      .update({ public: isPublic })
      .eq("id", docpackId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating docpack:", updateError);
      return json({ error: "Failed to update docpack" }, { status: 500 });
    }

    return json({ docpack: updatedDocpack });
  } catch (error) {
    console.error("Error updating docpack:", error);
    return json({ error: "Failed to update docpack" }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const docpackId = params.id;

  if (!docpackId) {
    return json({ error: "Missing docpack ID" }, { status: 400 });
  }

  try {
    // First, verify the docpack belongs to the user
    const { data: docpack, error: fetchError } = await supabase
      .from("docpacks")
      .select("*, jobs!inner(user_id)")
      .eq("id", docpackId)
      .eq("jobs.user_id", locals.user.id)
      .single();

    if (fetchError || !docpack) {
      return json(
        { error: "Docpack not found or unauthorized" },
        { status: 404 },
      );
    }

    // Delete the docpack file from R2 first
    const fileUrl = (docpack as any).file_url;
    if (fileUrl) {
      try {
        // Extract the key from the file_url
        // E.g., "https://...r2.cloudflarestorage.com/doctown-central/docpacks/uuid/file.docpack"
        // becomes "docpacks/uuid/file.docpack"
        let key: string | null = null;

        if (fileUrl.includes("r2.cloudflarestorage.com")) {
          const pathMatch = fileUrl.match(/\/doctown-central\/(.+)$/);
          if (pathMatch) {
            key = pathMatch[1];
          }
        }

        if (key) {
          const s3Client = new S3Client({
            region: "auto",
            endpoint: env.BUCKET_S3_ENDPOINT,
            credentials: {
              accessKeyId: env.BUCKET_ACCESS_KEY_ID || "",
              secretAccessKey: env.BUCKET_SECRET_ACCESS_KEY || "",
            },
          });

          const deleteCommand = new DeleteObjectCommand({
            Bucket: env.BUCKET_NAME || "doctown-central",
            Key: key,
          });

          await s3Client.send(deleteCommand);
          console.log(`Deleted docpack file from R2: ${key}`);
        }
      } catch (error) {
        console.error("Error deleting file from R2:", error);
        // Continue with database deletion even if R2 deletion fails
      }
    }

    // Delete the docpack from database
    // Note: This will also delete related job_logs due to CASCADE
    const { error: deleteError } = await supabase
      .from("docpacks")
      .delete()
      .eq("id", docpackId);

    if (deleteError) {
      console.error("Error deleting docpack:", deleteError);
      return json({ error: "Failed to delete docpack" }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting docpack:", error);
    return json({ error: "Failed to delete docpack" }, { status: 500 });
  }
};
