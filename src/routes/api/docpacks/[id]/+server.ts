import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { supabase } from "$lib/supabase";

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
