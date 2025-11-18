import type { RequestHandler } from "./$types";
import type { SymbolEdit } from "$lib/types";
import { supabase } from "$lib/supabase";
import { json } from "@sveltejs/kit";

/**
 * GET: Fetch all symbol edits for a docpack by the current user
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const { id: docpackId } = params;

    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: edits, error } = await supabase
      .from("symbol_edits")
      .select("*")
      .eq("docpack_id", docpackId)
      .eq("user_id", locals.user.id);

    if (error) {
      console.error("Error fetching edits:", error);
      return json({ error: "Failed to fetch edits" }, { status: 500 });
    }

    // Convert to a map for easier lookup: symbol_id -> edit
    const editsMap: Record<string, SymbolEdit> = {};
    for (const edit of (edits as SymbolEdit[]) || []) {
      editsMap[edit.symbol_id] = edit;
    }

    return json(editsMap);
  } catch (error) {
    console.error("Error in GET /api/docpacks/[id]/edits:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

/**
 * POST: Save or update a symbol edit
 */
export const POST: RequestHandler = async ({ params, locals, request }) => {
  try {
    const { id: docpackId } = params;

    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol_id,
      signature,
      kind,
      summary,
      description,
      parameters,
      returns,
      example,
      notes,
    } = body;

    if (!symbol_id) {
      return json({ error: "symbol_id is required" }, { status: 400 });
    }

    // Verify user owns or has access to this docpack
    const { data: docpack, error: docpackError } = await supabase
      .from("docpacks")
      .select("id, job_id, jobs!inner(user_id)")
      .eq("id", docpackId)
      .single();

    if (docpackError || !docpack) {
      return json({ error: "Docpack not found" }, { status: 404 });
    }

    const docpackData: any = docpack;
    if (docpackData.jobs?.user_id !== locals.user.id) {
      return json(
        { error: "Unauthorized - you can only edit your own docpacks" },
        { status: 403 },
      );
    }

    // Upsert the edit (insert or update if exists)
    const editData: any = {
      docpack_id: docpackId,
      user_id: locals.user.id,
      symbol_id,
    };

    // Only include fields that are provided (not undefined/null)
    if (signature !== undefined) editData.signature = signature;
    if (kind !== undefined) editData.kind = kind;
    if (summary !== undefined) editData.summary = summary;
    if (description !== undefined) editData.description = description;
    if (parameters !== undefined) editData.parameters = parameters;
    if (returns !== undefined) editData.returns = returns;
    if (example !== undefined) editData.example = example;
    if (notes !== undefined) editData.notes = notes;

    const { data, error } = await supabase
      .from("symbol_edits")
      .upsert(editData, {
        onConflict: "docpack_id,user_id,symbol_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving edit:", error);
      return json({ error: "Failed to save edit" }, { status: 500 });
    }

    return json(data);
  } catch (error) {
    console.error("Error in POST /api/docpacks/[id]/edits:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

/**
 * DELETE: Remove a symbol edit (revert to original)
 */
export const DELETE: RequestHandler = async ({ params, locals, request }) => {
  try {
    const { id: docpackId } = params;

    if (!locals.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { symbol_id } = body;

    if (!symbol_id) {
      return json({ error: "symbol_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("symbol_edits")
      .delete()
      .eq("docpack_id", docpackId)
      .eq("user_id", locals.user.id)
      .eq("symbol_id", symbol_id);

    if (error) {
      console.error("Error deleting edit:", error);
      return json({ error: "Failed to delete edit" }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/docpacks/[id]/edits:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
