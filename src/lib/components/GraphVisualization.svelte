<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import type { CodeGraph, GraphNode, GraphEdge, NodeRole } from "$lib/types";

  interface Props {
    graph: CodeGraph;
    onNodeClick?: (nodeId: string) => void;
  }

  let { graph, onNodeClick }: Props = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let simulation: d3.Simulation<any, any> | null = null;

  // Color scheme for node roles
  const roleColors: Record<NodeRole, string> = {
    CoreUtility: "#3b82f6", // blue
    EntryPoint: "#10b981", // green
    DataModel: "#8b5cf6", // purple
    Adapter: "#f59e0b", // amber
    Internal: "#6b7280", // gray
    Standard: "#94a3b8", // slate
  };

  // Color scheme for edge types
  const edgeColors = {
    Calls: "#64748b",
    TypeDependency: "#7c3aed",
    FileCoLocation: "#059669",
    Inherits: "#dc2626",
    Implements: "#ea580c",
  };

  onMount(() => {
    initializeGraph();
  });

  onDestroy(() => {
    if (simulation) {
      simulation.stop();
    }
  });

  function initializeGraph() {
    if (!container) return;

    // Clear previous content
    d3.select(container).selectAll("*").remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Validate graph data - check for orphaned edges
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const invalidEdges = graph.edges.filter(
      (e) => !nodeIds.has(e.from) || !nodeIds.has(e.to),
    );

    if (invalidEdges.length > 0) {
      console.warn(
        `Found ${invalidEdges.length} edges with invalid node references:`,
        invalidEdges.slice(0, 5),
      );
    }

    // Filter out edges that reference non-existent nodes
    const validEdges = graph.edges.filter(
      (e) => nodeIds.has(e.from) && nodeIds.has(e.to),
    );

    console.log(
      `Graph stats: ${graph.nodes.length} nodes, ${validEdges.length}/${graph.edges.length} valid edges`,
    );

    // Create SVG
    svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add background rectangle for better visual separation
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#080809"); // Darker blue-gray background

    // Add zoom behavior
    const g = svg.append("g");

    // Create grid pattern that transforms with zoom
    const gridSize = 64; // Grid spacing
    const gridExtent = 4096; // How far the grid extends

    const gridGroup = g.append("g").attr("class", "grid");

    // Vertical lines
    for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", -gridExtent)
        .attr("x2", x)
        .attr("y2", gridExtent)
        .attr("stroke", x === 0 ? "#334155" : "#1e293b")
        .attr("stroke-width", x === 0 ? 1.5 : 0.5)
        .attr("opacity", 0.3);
    }

    // Horizontal lines
    for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", -gridExtent)
        .attr("y1", y)
        .attr("x2", gridExtent)
        .attr("y2", y)
        .attr("stroke", y === 0 ? "#334155" : "#1e293b")
        .attr("stroke-width", y === 0 ? 1.5 : 0.5)
        .attr("opacity", 0.3);
    }

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create arrow markers and filters
    const defs = svg.append("defs");

    // Arrow markers for directed edges
    defs
      .selectAll("marker")
      .data(Object.keys(edgeColors))
      .join("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", (d) => edgeColors[d as keyof typeof edgeColors])
      .attr("d", "M0,-5L10,0L0,5");

    // Glow filter for highlighted edges
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create force simulation
    // Important: D3's forceLink expects edges with source/target, not from/to
    // We need to map our edges to use the correct format
    const d3Edges = validEdges.map((e) => ({
      source: e.from,
      target: e.to,
      kind: e.kind,
      weight: e.weight,
    }));

    simulation = d3
      .forceSimulation(graph.nodes as any)
      .force(
        "link",
        d3
          .forceLink(d3Edges as any)
          .id((d: any) => d.id)
          .distance(256)
          .strength((d: any) => d.weight),
      )
      .force("charge", d3.forceManyBody().strength(-64))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(32));

    // Create edges
    const link = g
      .append("g")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(d3Edges)
      .join("line")
      .attr("stroke", (d) => edgeColors[d.kind] || "#999")
      .attr("stroke-width", (d) => Math.sqrt(d.weight * 5))
      .attr("marker-end", (d) => `url(#arrow-${d.kind})`)
      .attr("class", "graph-edge")
      .attr("filter", "none");

    // Create nodes
    const node = g
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(graph.nodes)
      .join("circle")
      .attr("r", (d) => Math.max(5, Math.sqrt(d.importance) * 2))
      .attr("fill", (d) => roleColors[d.role] || "#999")
      .attr("class", "cursor-pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      })
      .call(
        d3
          .drag<SVGCircleElement, GraphNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any,
      );

    // Create labels for important nodes
    const label = g
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(graph.nodes.filter((d) => d.importance > 50))
      .join("text")
      .text((d) => d.name)
      .attr("font-size", 10)
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("fill", "#e2e8f0")
      .attr("pointer-events", "none");

    // Tooltip
    const tooltip = d3
      .select(container)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.9)")
      .style("color", "#fff")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("max-width", "300px");

    node
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible").html(
          `
            <div class="font-semibold">${d.name}</div>
            <div class="text-xs text-gray-300 mt-1">
              <div>Type: ${d.kind}</div>
              <div>Role: ${d.role}</div>
              <div>File: ${d.file.split("/").pop()}</div>
              <div>Line: ${d.line}</div>
              <div>Importance: ${d.importance}</div>
              <div>PageRank: ${d.pagerank.toFixed(4)}</div>
              <div>In-degree: ${d.in_degree} | Out-degree: ${d.out_degree}</div>
            </div>
          `,
        );

        // Highlight connected edges
        link
          .attr("stroke-opacity", (linkData: any) => {
            const isConnected = linkData.source.id === d.id || linkData.target.id === d.id;
            return isConnected ? 0.9 : 0.1;
          })
          .attr("filter", (linkData: any) => {
            const isConnected = linkData.source.id === d.id || linkData.target.id === d.id;
            return isConnected ? "url(#glow)" : "none";
          })
          .attr("stroke-width", (linkData: any) => {
            const isConnected = linkData.source.id === d.id || linkData.target.id === d.id;
            const baseWidth = Math.sqrt(linkData.weight * 5);
            return isConnected ? baseWidth * 1.5 : baseWidth;
          });
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");

        // Reset all edges to normal
        link
          .attr("stroke-opacity", 0.3)
          .attr("filter", "none")
          .attr("stroke-width", (d: any) => Math.sqrt(d.weight * 5));
      });

    // Update positions on simulation tick
    if (!simulation) return;
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    function dragstarted(
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
    ) {
      if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
      const s: any = event.subject;
      s.fx = s.x;
      s.fy = s.y;
    }

    function dragged(
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
    ) {
      const s: any = event.subject;
      s.fx = event.x;
      s.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
    ) {
      if (!event.active && simulation) simulation.alphaTarget(0);
      const s: any = event.subject;
      s.fx = null;
      s.fy = null;
    }
  }
</script>

<div class="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
  <div bind:this={container} class="w-full h-full"></div>

  <!-- Legend -->
  <div
    class="absolute top-4 right-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg text-xs text-gray-200 max-w-xs"
  >
    <div class="font-semibold mb-2">Node Roles</div>
    <div class="space-y-1">
      {#each Object.entries(roleColors) as [role, color]}
        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 rounded-full"
            style="background-color: {color}"
          ></div>
          <span>{role}</span>
        </div>
      {/each}
    </div>

    <div class="font-semibold mt-4 mb-2">Edge Types</div>
    <div class="space-y-1">
      {#each Object.entries(edgeColors) as [type, color]}
        <div class="flex items-center gap-2">
          <div class="w-3 h-0.5" style="background-color: {color}"></div>
          <span>{type}</span>
        </div>
      {/each}
    </div>

    <div class="mt-4 text-gray-400 text-xs">
      <div>• Node size = importance</div>
      <div>• Drag nodes to reposition</div>
      <div>• Scroll to zoom</div>
      <div>• Click node to view details</div>
    </div>
  </div>

  <!-- Stats Panel -->
  <div
    class="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg text-xs text-gray-200"
  >
    <div class="font-semibold mb-2">Graph Statistics</div>
    <div class="space-y-1">
      <div>Nodes: {graph.stats.node_count}</div>
      <div>Edges: {graph.stats.edge_count}</div>
      <div>
        Avg In-degree: {graph.stats.avg_in_degree.toFixed(2)}
      </div>
      <div>
        Avg Out-degree: {graph.stats.avg_out_degree.toFixed(2)}
      </div>
    </div>
  </div>
</div>

<style>
  :global(.tooltip) {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
</style>
