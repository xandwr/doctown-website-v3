import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "$env/dynamic/private";
import JSZip from "jszip";

/**
 * Query public docpacks directly from R2 by reading manifests.
 * This endpoint demonstrates the authoritative approach where the manifest
 * is the single source of truth for privacy, eliminating the need to query
 * the database for visibility information.
 */
export const GET: RequestHandler = async () => {
  try {
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
    const publicDocpacks: any[] = [];

    // List all docpacks in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: "docpacks/",
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents) {
      return json({ docpacks: [] });
    }

    // Filter for .docpack files and extract manifests
    for (const obj of listResponse.Contents) {
      if (!obj.Key?.endsWith(".docpack")) {
        continue;
      }

      try {
        // Download the docpack file
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: obj.Key,
        });

        const getResponse = await s3Client.send(getCommand);

        if (!getResponse.Body) {
          continue;
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of getResponse.Body as any) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Extract manifest from ZIP
        const zip = await JSZip.loadAsync(buffer);
        const manifestFile = zip.file("manifest.json");

        if (!manifestFile) {
          console.warn(`No manifest.json found in ${obj.Key}`);
          continue;
        }

        const manifestText = await manifestFile.async("text");
        const manifest = JSON.parse(manifestText);

        // Only include public docpacks
        if (manifest.public === true) {
          publicDocpacks.push({
            file_url: `https://doctown.dev/api/docpacks/download?path=${encodeURIComponent(obj.Key)}`,
            name: manifest.project?.name || "Unknown",
            full_name:
              manifest.project?.repo?.split("/").slice(-2).join("/") ||
              "Unknown",
            description: null,
            repo_url: manifest.project?.repo || "",
            commit_hash: manifest.project?.commit || null,
            version: manifest.project?.version || null,
            updated_at:
              obj.LastModified?.toISOString() || new Date().toISOString(),
            status: "public",
            stats: manifest.stats || {},
            language_summary: manifest.language_summary || {},
          });
        }
      } catch (error) {
        console.error(`Error processing ${obj.Key}:`, error);
        // Continue processing other docpacks
      }
    }

    return json({
      docpacks: publicDocpacks,
      source: "r2-manifests",
      message: "Queried directly from R2 manifests - no database dependency",
    });
  } catch (error) {
    console.error("Error fetching public docpacks from R2:", error);
    return json(
      {
        error: "Failed to fetch public docpacks from R2",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
