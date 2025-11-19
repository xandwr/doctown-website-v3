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
  tracked_branch?: string;
  frozen?: boolean;
}

// Branch information from GitHub API
export interface BranchInfo {
  name: string;
  commit_sha: string;
  protected: boolean;
  is_default: boolean;
}

// Status badge configuration - semantic color system
export const STATUS_CONFIG: Record<
  DocpackStatus,
  { status: DocpackStatus; label: string; description: string }
> = {
  pending: {
    status: "pending",
    label: "Pending",
    description:
      "Docpack is awaiting generation. Click to configure and make public.",
  },
  valid: {
    status: "valid",
    label: "Valid",
    description: "Docpack has been generated and validated. Ready to publish.",
  },
  public: {
    status: "public",
    label: "Public",
    description: "Docpack is live and accessible globally in the commons.",
  },
  failed: {
    status: "failed",
    label: "Failed",
    description: "Docpack generation failed. Check logs for details.",
  },
  building: {
    status: "building",
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
  tracked_branch: string | null;
}

// Symbol edit interface - stores user modifications
export interface SymbolEdit {
  id: string;
  docpack_id: string;
  user_id: string;
  symbol_id: string;
  signature?: string;
  kind?: string;
  summary?: string;
  description?: string;
  parameters?: DocpackParameter[];
  returns?: string;
  example?: string;
  notes?: string[];
  created_at: string;
  updated_at: string;
}
