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

// Docpack content types - matches the DOCPACK_FORMAT.md specification
export interface DocpackManifest {
  docpack_format: number;
  project: {
    name: string;
    version: string;
    repo: string;
    commit: string;
  };
  generated_at: string;
  language_summary: Record<string, number>;
  stats: {
    symbols_extracted: number;
    docs_generated: number;
  };
  public: boolean;
}

export interface DocpackSymbol {
  id: string;
  kind: string;
  file: string;
  line: number;
  signature: string;
  doc_id: string;
  fields?: string[];
}

export interface DocpackParameter {
  name: string;
  type: string;
  description: string;
}

export interface DocpackDocumentation {
  symbol: string;
  summary: string;
  description: string;
  parameters: DocpackParameter[];
  returns: string;
  example: string;
  notes: string[];
}

export interface DocpackContent {
  manifest: DocpackManifest;
  symbols: DocpackSymbol[];
  docs: Record<string, DocpackDocumentation>;
}
