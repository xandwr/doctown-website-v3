import type { RequestHandler } from "./$types";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import { supabase } from "$lib/supabase";

/**
 * Download proxy endpoint for docpacks.
 * Accepts ?path=<r2-key> and streams the file if:
 * 1. The docpack is marked as public, OR
 * 2. The authenticated user owns the docpack
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const path = url.searchParams.get("path");

    if (!path) {
      return new Response(
        JSON.stringify({ error: "Missing 'path' query parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate credentials
    const accessKeyId = env.BUCKET_ACCESS_KEY_ID;
    const secretAccessKey = env.BUCKET_SECRET_ACCESS_KEY;
    const endpoint = env.BUCKET_S3_ENDPOINT;
    const bucketName = env.BUCKET_NAME || "doctown-central";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      console.error("Missing S3 credentials:", {
        hasAccessKey: !!accessKeyId,
        hasSecretKey: !!secretAccessKey,
        hasEndpoint: !!endpoint,
      });
      return new Response(
        JSON.stringify({ error: "S3 credentials not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check authorization: docpack must be either public OR owned by the current user
    // First, find the docpack by matching the file_url path
    const { data: docpacks, error: dbError } = await supabase
      .from("docpacks")
      .select("id, public, file_url, job_id, jobs!inner(user_id)");

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to verify docpack status" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Find the docpack that matches this path
    const docpack: any = docpacks?.find((dp: any) =>
      dp.file_url?.includes(path),
    );

    if (!docpack) {
      return new Response(JSON.stringify({ error: "Docpack not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user has access: either public OR user owns it
    const isPublic = docpack.public === true;
    const isOwner = locals.user && docpack.jobs?.user_id === locals.user.id;

    if (!isPublic && !isOwner) {
      return new Response(
        JSON.stringify({
          error:
            "Access denied. This docpack is not public and you do not own it.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    // Download the docpack file
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    const getResponse = await s3Client.send(getCommand);

    if (!getResponse.Body) {
      return new Response(
        JSON.stringify({ error: "File not found in storage" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of getResponse.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return the file
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${path.split("/").pop()}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading docpack:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to download docpack",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
