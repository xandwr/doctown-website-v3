import type { RequestHandler } from "./$types";
import type { SymbolEdit, BuilderDocumentation } from "$lib/types";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import { supabase } from "$lib/supabase";
import JSZip from "jszip";

/**
 * POST: Export docpack with user edits applied
 * Creates a new version of the docpack with all user edits merged in
 *
 * New format (builder v2):
 * - graph.json: Code graph (not modified by edits)
 * - documentation.json: LLM documentation (edits applied to symbol_summaries)
 * - metadata.json: Package metadata (not modified)
 */
export const POST: RequestHandler = async ({ params, locals }) => {
  try {
    const docpackId = params.id;

    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get docpack info
    const { data: docpack, error: dbError } = await supabase
      .from("docpacks")
      .select("id, file_url, name, jobs!inner(user_id)")
      .eq("id", docpackId)
      .single();

    if (dbError || !docpack) {
      return new Response(JSON.stringify({ error: "Docpack not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const docpackData: any = docpack;
    if (docpackData.jobs?.user_id !== locals.user.id) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized - you can only export your own docpacks",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get user's edits
    const { data: edits, error: editsError } = await supabase
      .from("symbol_edits")
      .select("*")
      .eq("docpack_id", docpackId)
      .eq("user_id", locals.user.id);

    if (editsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch edits" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!edits || edits.length === 0) {
      return new Response(JSON.stringify({ error: "No edits to export" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Download original docpack
    const urlMatch = docpackData.file_url.match(
      /docpacks\/[^/]+\/[^/]+\.docpack/,
    );
    if (!urlMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid file URL format" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const s3Client = new S3Client({
      region: "auto",
      endpoint: env.BUCKET_S3_ENDPOINT,
      credentials: {
        accessKeyId: env.BUCKET_ACCESS_KEY_ID!,
        secretAccessKey: env.BUCKET_SECRET_ACCESS_KEY!,
      },
    });

    const command = new GetObjectCommand({
      Bucket: env.BUCKET_NAME || "doctown-central",
      Key: urlMatch[0],
    });

    const response = await s3Client.send(command);
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Load and modify the ZIP
    const zip = await JSZip.loadAsync(buffer);

    // Create edits map for quick lookup
    const editsMap: Record<string, SymbolEdit> = {};
    for (const edit of edits as SymbolEdit[]) {
      editsMap[edit.symbol_id] = edit;
    }

    // Update documentation.json with user edits
    const documentationFile = zip.file("documentation.json");
    if (documentationFile) {
      const documentationText = await documentationFile.async("text");
      const documentation: BuilderDocumentation = JSON.parse(documentationText);

      // Apply edits to symbol_summaries
      for (const [nodeId, edit] of Object.entries(editsMap)) {
        const symbolDoc = documentation.symbol_summaries[nodeId];
        if (symbolDoc) {
          // Apply user edits, overwriting generated content
          if (edit.purpose) symbolDoc.purpose = edit.purpose;
          if (edit.explanation) symbolDoc.explanation = edit.explanation;
          if (edit.complexity_notes)
            symbolDoc.complexity_notes = edit.complexity_notes;
          if (edit.usage_hints) symbolDoc.usage_hints = edit.usage_hints;
        } else {
          // Create new entry if symbol doesn't have documentation
          documentation.symbol_summaries[nodeId] = {
            node_id: nodeId,
            purpose: edit.purpose || "",
            explanation: edit.explanation || "",
            complexity_notes: edit.complexity_notes || null,
            usage_hints: edit.usage_hints || null,
            caller_references: [],
            callee_references: [],
            semantic_cluster: null,
          };
        }
      }

      zip.file("documentation.json", JSON.stringify(documentation, null, 2));
    }

    // Generate the modified ZIP
    const modifiedBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Upload to R2 with a new name (add -edited suffix)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const editedPath = `docpacks/${locals.user.id}/${docpackData.name}-edited-${timestamp}.docpack`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.BUCKET_NAME || "doctown-central",
        Key: editedPath,
        Body: modifiedBuffer,
        ContentType: "application/zip",
      }),
    );

    const downloadUrl = `${env.BUCKET_PUBLIC_URL}/${editedPath}`;

    return new Response(
      JSON.stringify({
        success: true,
        download_url: downloadUrl,
        edits_applied: edits.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error exporting docpack with edits:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to export docpack",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
