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
  stargazers_count?: number;
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

// ============================================================================
// NEW BUILDER FORMAT TYPES - matches builder/src/graph/mod.rs output
// ============================================================================

// Graph node kinds - matches builder NodeKind enum
export type GraphNodeKind =
  | { Function: FunctionNodeData }
  | { Type: TypeNodeData }
  | { Trait: TraitNodeData }
  | { Module: ModuleNodeData }
  | { Constant: ConstantNodeData }
  | { File: FileNodeData }
  | { Cluster: ClusterNodeData }
  | { Package: PackageNodeData }
  | { Macro: MacroNodeData };

export interface FunctionNodeData {
  name: string;
  signature: string;
  is_public: boolean;
  is_async: boolean;
  is_method: boolean;
  parameters: GraphParameter[];
  return_type: string | null;
}

export interface TypeNodeData {
  name: string;
  kind: TypeKindEnum;
  is_public: boolean;
  fields: GraphField[];
  methods: string[]; // NodeIds
}

export type TypeKindEnum =
  | "Struct"
  | "Class"
  | "Enum"
  | "Interface"
  | "Trait"
  | "Union"
  | "TypeAlias";

export interface TraitNodeData {
  name: string;
  is_public: boolean;
  methods: string[];
  implementors: string[];
}

export interface ModuleNodeData {
  name: string;
  path: string;
  is_public: boolean;
  children: string[];
}

export interface ConstantNodeData {
  name: string;
  value_type: string | null;
  is_public: boolean;
}

export interface FileNodeData {
  path: string;
  language: string;
  size_bytes: number;
  line_count: number;
  symbols: string[];
}

export interface ClusterNodeData {
  name: string;
  topic: string | null;
  members: string[];
  keywords: string[];
  centroid: number[] | null;
}

export interface PackageNodeData {
  name: string;
  version: string | null;
  modules: string[];
}

export interface MacroNodeData {
  name: string;
  is_public: boolean;
  macro_type: "Declarative" | "Procedural" | "Derive" | "Attribute";
  pattern: string | null;
}

export interface GraphParameter {
  name: string;
  param_type: string | null;
  is_mutable: boolean;
}

export interface GraphField {
  name: string;
  field_type: string | null;
  is_public: boolean;
}

export interface GraphLocation {
  file: string;
  start_line: number;
  end_line: number;
  start_col: number;
  end_col: number;
}

export interface GraphNodeMetadata {
  complexity: number | null;
  fan_in: number;
  fan_out: number;
  is_public_api: boolean;
  docstring: string | null;
  tags: string[];
  source_snippet: string | null;
}

// Full graph node from builder
export interface BuilderGraphNode {
  id: string;
  kind: GraphNodeKind;
  location: GraphLocation;
  metadata: GraphNodeMetadata;
}

// Graph edge kinds - matches builder EdgeKind enum
export type GraphEdgeKind =
  | "Calls"
  | "Imports"
  | "TypeReference"
  | "DataFlow"
  | "ModuleOwnership"
  | "TraitImplementation"
  | "Inheritance"
  | "MethodOf"
  | "DefinedIn"
  | "InferredType"
  | "TraitMethodCall"
  | "MethodDispatch"
  | "MacroExpansion"
  | "TraitProvides";

export interface BuilderGraphEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

export interface BuilderGraphMetadata {
  repository_name: string | null;
  total_files: number;
  total_symbols: number;
  languages: string[];
  created_at: string;
}

// Full graph from builder (graph.json)
export interface BuilderGraph {
  nodes: Record<string, BuilderGraphNode>;
  edges: BuilderGraphEdge[];
  metadata: BuilderGraphMetadata;
}

// ============================================================================
// DOCUMENTATION FORMAT - matches builder/src/pipeline/generate.rs output
// ============================================================================

export interface SymbolDoc {
  node_id: string;
  purpose: string;
  explanation: string;
  complexity_notes: string | null;
  usage_hints: string | null;
  caller_references: string[];
  callee_references: string[];
  semantic_cluster: string | null;
}

export interface ModuleDoc {
  module_name: string;
  responsibilities: string;
  key_symbols: string[];
  interactions: string;
}

export interface ArchitectureDoc {
  overview: string;
  system_behavior: string;
  data_flow: string;
  key_components: string[];
}

// Full documentation from builder (documentation.json)
export interface BuilderDocumentation {
  symbol_summaries: Record<string, SymbolDoc>;
  module_overviews: Record<string, ModuleDoc>;
  architecture_overview: ArchitectureDoc;
  total_tokens_used: number;
}

// Package metadata from builder (metadata.json)
export interface BuilderMetadata {
  version: string;
  generator: string;
  source: string;
  generated_at: string;
  files_included: number;
  total_size_bytes: number;
  format: string;
  contents: Record<string, string>;
}

// ============================================================================
// DOCPACK CONTENT - Combined format for frontend consumption
// ============================================================================

export interface DocpackContent {
  graph: BuilderGraph;
  documentation: BuilderDocumentation;
  metadata: BuilderMetadata;
  tracked_branch: string | null;
}

// Helper to get node name from kind
export function getNodeName(kind: GraphNodeKind): string {
  if ("Function" in kind) return kind.Function.name;
  if ("Type" in kind) return kind.Type.name;
  if ("Trait" in kind) return kind.Trait.name;
  if ("Module" in kind) return kind.Module.name;
  if ("Constant" in kind) return kind.Constant.name;
  if ("File" in kind) return kind.File.path;
  if ("Cluster" in kind) return kind.Cluster.name;
  if ("Package" in kind) return kind.Package.name;
  if ("Macro" in kind) return kind.Macro.name;
  return "unknown";
}

// Helper to get node kind string
export function getNodeKindString(kind: GraphNodeKind): string {
  if ("Function" in kind) return "function";
  if ("Type" in kind) return "type";
  if ("Trait" in kind) return "trait";
  if ("Module" in kind) return "module";
  if ("Constant" in kind) return "constant";
  if ("File" in kind) return "file";
  if ("Cluster" in kind) return "cluster";
  if ("Package" in kind) return "package";
  if ("Macro" in kind) return "macro";
  return "unknown";
}

// Helper to check if node is public
export function isNodePublic(kind: GraphNodeKind): boolean {
  if ("Function" in kind) return kind.Function.is_public;
  if ("Type" in kind) return kind.Type.is_public;
  if ("Trait" in kind) return kind.Trait.is_public;
  if ("Module" in kind) return kind.Module.is_public;
  if ("Constant" in kind) return kind.Constant.is_public;
  if ("Macro" in kind) return kind.Macro.is_public;
  // Files, clusters, packages are always "public" in terms of visibility
  return true;
}

// Symbol edit interface - stores user modifications to documentation
export interface SymbolEdit {
  id: string;
  docpack_id: string;
  user_id: string;
  symbol_id: string; // Maps to node_id in the graph
  // User can override any of these fields from the generated SymbolDoc
  purpose?: string;
  explanation?: string;
  complexity_notes?: string;
  usage_hints?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VISUALIZATION TYPES - Transformed from BuilderGraph for D3 rendering
// ============================================================================

// Role inferred from graph structure for visualization
export type VisualizationRole =
  | "CoreUtility" // High fan-in, called by many
  | "EntryPoint" // High fan-out, calls many things
  | "DataModel" // Type node
  | "Internal" // Private/low connectivity
  | "Cluster" // Semantic cluster node
  | "Standard"; // Default

// Visualization node (transformed from BuilderGraphNode)
export interface VisualizationNode {
  id: string;
  name: string;
  kind: string; // "function", "type", "module", etc.
  file: string;
  line: number;
  fan_in: number;
  fan_out: number;
  role: VisualizationRole;
  importance: number; // Computed from fan_in + complexity
  is_public: boolean;
  complexity: number | null;
  cluster: string | null; // Cluster name if assigned
}

// Visualization edge (transformed from BuilderGraphEdge)
export interface VisualizationEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

// Stats computed from the graph
export interface VisualizationStats {
  node_count: number;
  edge_count: number;
  function_count: number;
  type_count: number;
  module_count: number;
  cluster_count: number;
  languages: string[];
  top_symbols: Array<{
    id: string;
    name: string;
    importance: number;
    role: VisualizationRole;
  }>;
}

// Full visualization graph (what D3 components consume)
export interface VisualizationGraph {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
  stats: VisualizationStats;
}

// Helper to transform BuilderGraph to VisualizationGraph
export function transformGraphForVisualization(
  graph: BuilderGraph,
): VisualizationGraph {
  const nodes: VisualizationNode[] = [];
  const edges: VisualizationEdge[] = [];

  // Transform nodes
  for (const [id, node] of Object.entries(graph.nodes)) {
    const name = getNodeName(node.kind);
    const kindStr = getNodeKindString(node.kind);
    const isPublic = isNodePublic(node.kind);

    // Determine role based on structure
    let role: VisualizationRole = "Standard";
    if (kindStr === "cluster") {
      role = "Cluster";
    } else if (kindStr === "type") {
      role = "DataModel";
    } else if (node.metadata.fan_in > 5) {
      role = "CoreUtility";
    } else if (node.metadata.fan_out > 5) {
      role = "EntryPoint";
    } else if (!isPublic) {
      role = "Internal";
    }

    // Compute importance score
    const importance =
      node.metadata.fan_in * 2 +
      node.metadata.fan_out +
      (node.metadata.complexity || 0) / 10 +
      (node.metadata.is_public_api ? 5 : 0);

    // Find cluster membership
    let cluster: string | null = null;
    if ("Cluster" in node.kind) {
      cluster = node.kind.Cluster.name;
    }

    nodes.push({
      id,
      name,
      kind: kindStr,
      file: node.location.file,
      line: node.location.start_line,
      fan_in: node.metadata.fan_in,
      fan_out: node.metadata.fan_out,
      role,
      importance,
      is_public: isPublic,
      complexity: node.metadata.complexity,
      cluster,
    });
  }

  // Transform edges
  for (const edge of graph.edges) {
    edges.push({
      source: edge.source,
      target: edge.target,
      kind: edge.kind,
    });
  }

  // Sort nodes by importance for top symbols
  const sortedNodes = [...nodes].sort((a, b) => b.importance - a.importance);
  const topSymbols = sortedNodes.slice(0, 10).map((n) => ({
    id: n.id,
    name: n.name,
    importance: n.importance,
    role: n.role,
  }));

  // Compute stats
  const stats: VisualizationStats = {
    node_count: nodes.length,
    edge_count: edges.length,
    function_count: nodes.filter((n) => n.kind === "function").length,
    type_count: nodes.filter((n) => n.kind === "type").length,
    module_count: nodes.filter((n) => n.kind === "module").length,
    cluster_count: nodes.filter((n) => n.kind === "cluster").length,
    languages: graph.metadata.languages,
    top_symbols: topSymbols,
  };

  return { nodes, edges, stats };
}
