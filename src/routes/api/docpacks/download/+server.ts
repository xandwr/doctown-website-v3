import type { RequestHandler } from "./$types";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import { supabase } from "$lib/supabase";

/**
 * Download proxy endpoint for public docpacks.
 * Accepts ?path=<r2-key> and streams the file if marked as public in the database.
 */
export const GET: RequestHandler = async ({ url }) => {
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

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: env.BUCKET_S3_ENDPOINT,
      credentials: {
        accessKeyId: env.BUCKET_ACCESS_KEY_ID || "",
        secretAccessKey: env.BUCKET_SECRET_ACCESS_KEY || "",
      },
    });

    const bucketName = env.BUCKET_NAME || "doctown-central";

    // Download the docpack file
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    const getResponse = await s3Client.send(getCommand);

    if (!getResponse.Body) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify the docpack is public by checking the database
    // The file_url in database contains the full R2 path, we need to find docpack by matching the path
    const { data: docpacks, error: dbError } = await supabase
      .from("docpacks")
      .select("public, file_url")
      .eq("public", true);

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

    // Check if this path matches any public docpack
    const isPublic = docpacks?.some((dp) => dp.file_url?.includes(path));

    if (!isPublic) {
      return new Response(
        JSON.stringify({ error: "This docpack is not public" }),
        {
          status: 403,
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
