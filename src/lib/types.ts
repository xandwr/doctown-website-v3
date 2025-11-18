// Docpack status represents the lifecycle of a documentation package
export type DocpackStatus =
  | "pending"
  | "valid"
  | "public"
  | "failed"
  | "building";

// Extended docpack interface with status and versioning
export interface Docpack {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  updated_at: string;
  status: DocpackStatus;
  repo_url: string;
  commit_hash?: string;
  version?: string;
  is_private?: boolean;
  language?: string | null;
  file_url: string | null;
}

// Status badge configuration - liminal palette
// Colors map to: orange->rust, green/cyan->corpse, red->decay
export const STATUS_CONFIG: Record<
  DocpackStatus,
  { color: string; label: string; description: string }
> = {
  pending: {
    color: "orange", // Maps to rust in components
    label: "Pending",
    description:
      "Docpack is awaiting generation. Click to configure and make public.",
  },
  valid: {
    color: "green", // Maps to corpse in components
    label: "Valid",
    description: "Docpack has been generated and validated. Ready to publish.",
  },
  public: {
    color: "cyan", // Maps to corpse in components
    label: "Public",
    description: "Docpack is live and accessible globally in the commons.",
  },
  failed: {
    color: "red", // Maps to decay in components
    label: "Failed",
    description: "Docpack generation failed. Check logs for details.",
  },
  building: {
    color: "orange", // Maps to rust in components
    label: "Building",
    description: "Docpack generation in progress. Check back soon!",
  },
};
