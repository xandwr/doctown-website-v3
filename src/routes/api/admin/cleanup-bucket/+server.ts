import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import { supabase } from "$lib/supabase";

/**
 * Admin endpoint to clean up orphaned docpacks from R2 bucket.
 * Removes files from the bucket that no longer have corresponding database entries.
 *
 * Authentication: Requires admin secret header
 *
 * Query params:
 *   - dry_run=true: List files that would be deleted without actually deleting them
 */
export const POST: RequestHandler = async ({ request, url }) => {
  try {
    // Check admin authentication
    const authHeader = request.headers.get("authorization");
    const adminSecret = env.DOCTOWN_BUILDER_SHARED_SECRET; // Reuse the builder secret for admin ops
    const expectedAuth = `Bearer ${adminSecret}`;

    if (!authHeader || authHeader !== expectedAuth) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const dryRun = url.searchParams.get("dry_run") === "true";

    // Validate S3 credentials
    const accessKeyId = env.BUCKET_ACCESS_KEY_ID;
    const secretAccessKey = env.BUCKET_SECRET_ACCESS_KEY;
    const endpoint = env.BUCKET_S3_ENDPOINT;
    const bucketName = env.BUCKET_NAME || "doctown-central";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      return json({ error: "S3 credentials not configured" }, { status: 500 });
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: "auto",
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    // Get all docpack file_urls from database
    const { data: docpacks, error: dbError } = await supabase
      .from("docpacks")
      .select("file_url");

    if (dbError) {
      console.error("Database error:", dbError);
      return json(
        { error: "Failed to fetch docpacks from database" },
        { status: 500 },
      );
    }

    // Extract all valid file paths from database URLs
    const validPaths = new Set<string>();
    docpacks?.forEach((pack: any) => {
      if (pack.file_url) {
        // Extract the path from URL
        // Format: https://...r2.cloudflarestorage.com/bucket-name/docpacks/user_id/file.docpack
        // or: https://www.doctown.dev/api/docpacks/download?path=docpacks/user_id/file.docpack
        try {
          if (pack.file_url.includes("docpacks/")) {
            const match = pack.file_url.match(/docpacks\/[^?]+\.docpack/);
            if (match) {
              validPaths.add(match[0]);
            }
          }
        } catch (e) {
          console.error(`Failed to parse file_url: ${pack.file_url}`, e);
        }
      }
    });

    console.log(`Found ${validPaths.size} valid docpack paths in database`);

    // List all docpack files in bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "docpacks/",
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return json({
        message: "No files found in bucket",
        deleted: [],
        kept: 0,
      });
    }

    const toDelete: string[] = [];
    let keptCount = 0;

    // Check each file in bucket
    for (const obj of listResponse.Contents) {
      if (!obj.Key) continue;

      // Only process .docpack files
      if (!obj.Key.endsWith(".docpack")) {
        continue;
      }

      // Check if this file is referenced in the database
      if (!validPaths.has(obj.Key)) {
        toDelete.push(obj.Key);
      } else {
        keptCount++;
      }
    }

    console.log(`Found ${toDelete.length} orphaned files to delete`);
    console.log(`Keeping ${keptCount} files that are in the database`);

    // Delete orphaned files (unless dry run)
    const deleted: string[] = [];
    if (!dryRun && toDelete.length > 0) {
      for (const key of toDelete) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: key,
            }),
          );
          deleted.push(key);
          console.log(`Deleted: ${key}`);
        } catch (error) {
          console.error(`Failed to delete ${key}:`, error);
        }
      }
    }

    return json({
      message: dryRun
        ? "Dry run completed - no files were deleted"
        : `Cleanup completed - deleted ${deleted.length} orphaned files`,
      dry_run: dryRun,
      orphaned_files: toDelete,
      deleted: deleted,
      kept: keptCount,
      total_in_bucket: listResponse.Contents.length,
      total_in_database: validPaths.size,
    });
  } catch (error) {
    console.error("Error during bucket cleanup:", error);
    return json(
      {
        error: "Bucket cleanup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
