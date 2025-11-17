import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";

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

    // Delete the docpack
    // Note: This will also delete related job_logs due to CASCADE
    const { error: deleteError } = await supabase
      .from("docpacks")
      .delete()
      .eq("id", docpackId);

    if (deleteError) {
      console.error("Error deleting docpack:", deleteError);
      return json({ error: "Failed to delete docpack" }, { status: 500 });
    }

    // TODO: Delete the .docpack file from S3 bucket
    // const fileUrl = docpack.file_url;
    // if (fileUrl) {
    //   await deleteFromS3(fileUrl);
    // }

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting docpack:", error);
    return json({ error: "Failed to delete docpack" }, { status: 500 });
  }
};
