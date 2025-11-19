import type { RequestHandler } from "./$types";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import { supabase } from "$lib/supabase";
import JSZip from "jszip";
import type { DocpackContent } from "$lib/types";

/**
 * API endpoint to extract and return the content of a docpack.
 * Returns manifest, symbols, and all documentation from the ZIP archive.
 *
 * Access control: docpack must be public OR owned by the authenticated user
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const docpackId = params.id;

    if (!docpackId) {
      return new Response(JSON.stringify({ error: "Missing docpack ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get docpack info from database
    const { data: docpack, error: dbError } = await supabase
      .from("docpacks")
      .select(
        "id, file_url, public, job_id, tracked_branch, jobs!inner(user_id)",
      )
      .eq("id", docpackId)
      .single();

    if (dbError || !docpack) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ error: "Docpack not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check authorization
    const docpackData: any = docpack;
    const isPublic = docpackData.public === true;
    const isOwner = locals.user && docpackData.jobs?.user_id === locals.user.id;

    if (!isPublic && !isOwner) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access to private docpack" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!docpackData.file_url) {
      return new Response(
        JSON.stringify({ error: "Docpack file URL not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Extract R2 path from file_url
    const urlMatch = docpackData.file_url.match(
      /docpacks\/[^/]+\/[^/]+\.docpack/,
    );
    if (!urlMatch) {
      return new Response(
        JSON.stringify({ error: "Invalid file URL format" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const path = urlMatch[0];

    // Validate S3 credentials
    const accessKeyId = env.BUCKET_ACCESS_KEY_ID;
    const secretAccessKey = env.BUCKET_SECRET_ACCESS_KEY;
    const endpoint = env.BUCKET_S3_ENDPOINT;
    const bucketName = env.BUCKET_NAME || "doctown-central";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      console.error("Missing S3 credentials");
      return new Response(
        JSON.stringify({ error: "S3 credentials not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Download the docpack file from R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return new Response(
        JSON.stringify({ error: "Empty response from storage" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse the ZIP file
    const zip = await JSZip.loadAsync(buffer);

    // Extract manifest
    const manifestFile = zip.file("manifest.json");
    if (!manifestFile) {
      return new Response(
        JSON.stringify({ error: "manifest.json not found in docpack" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    const manifestText = await manifestFile.async("text");
    const manifest = JSON.parse(manifestText);

    // Extract symbols
    const symbolsFile = zip.file("symbols.json");
    if (!symbolsFile) {
      return new Response(
        JSON.stringify({ error: "symbols.json not found in docpack" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    const symbolsText = await symbolsFile.async("text");
    const symbols = JSON.parse(symbolsText);

    // Extract all documentation files
    const docs: Record<string, any> = {};
    const docsFolder = zip.folder("docs");

    if (docsFolder) {
      const docFiles = Object.keys(zip.files).filter(
        (name) => name.startsWith("docs/") && name.endsWith(".json"),
      );

      for (const docPath of docFiles) {
        const docFile = zip.file(docPath);
        if (docFile) {
          const docText = await docFile.async("text");
          const doc = JSON.parse(docText);
          // Extract doc_id from filename (e.g., "docs/doc_0001.json" -> "doc_0001")
          const docId = docPath.replace("docs/", "").replace(".json", "");
          docs[docId] = doc;
        }
      }
    }

    const content: DocpackContent = {
      manifest,
      symbols,
      docs,
      tracked_branch: docpackData.tracked_branch || null,
    };

    return new Response(JSON.stringify(content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error extracting docpack content:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to extract docpack content",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
