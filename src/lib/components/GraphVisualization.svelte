<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";
  import type { VisualizationGraph, VisualizationNode, VisualizationEdge, VisualizationRole, GraphEdgeKind } from "$lib/types";

  interface Props {
    graph: VisualizationGraph;
    onNodeClick?: (nodeId: string) => void;
  }

  let { graph, onNodeClick }: Props = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let simulation: d3.Simulation<any, any> | null = null;
  let hoveredNodeId: string | null = null;
  let selectedNodeId: string | null = null;
  let isDragging = false;
  let idleTimer: number | null = null;
  let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  let showLegend = $state(false);
  let showStats = $state(false);
  let isMobile = $state(false);
  let selectedNode: VisualizationNode | null = $state(null);
  let linkSelection: any = null;
  let detailPanelGroup: any = null;
  let currentTransform: any = null;

  // Color scheme for node roles
  const roleColors: Record<VisualizationRole, string> = {
    CoreUtility: "#3b82f6", // blue
    EntryPoint: "#10b981", // green
    DataModel: "#8b5cf6", // purple
    Internal: "#6b7280", // gray
    Cluster: "#10b981", // emerald
    Standard: "#94a3b8", // slate
  };

  // Color scheme for edge types
  const edgeColors: Record<GraphEdgeKind, string> = {
    Calls: "#64748b",
    Imports: "#059669",
    TypeReference: "#7c3aed",
    DataFlow: "#0ea5e9",
    ModuleOwnership: "#f59e0b",
    TraitImplementation: "#ea580c",
    Inheritance: "#dc2626",
    MethodOf: "#8b5cf6",
    DefinedIn: "#6b7280",
    InferredType: "#14b8a6",
    TraitMethodCall: "#f97316",
    MethodDispatch: "#3b82f6",
    MacroExpansion: "#a855f7",
    TraitProvides: "#ec4899",
  };

  onMount(() => {
    // Check if mobile
    isMobile = window.innerWidth < 768;
    const handleResize = () => {
      isMobile = window.innerWidth < 768;
    };
    window.addEventListener("resize", handleResize);

    // Initialize graph
    initializeGraph();

    return () => window.removeEventListener("resize", handleResize);
  });

  onDestroy(() => {
    if (simulation) {
      simulation.stop();
    }
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
  });

  function resetIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    idleTimer = window.setTimeout(() => {
      zoomToFit();
    }, 30000); // 30 seconds
  }

  function zoomToFit() {
    if (!svg || !zoomBehavior || !simulation) return;

    const nodes = simulation.nodes();
    if (nodes.length === 0) return;

    // Calculate bounding box of all nodes
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    nodes.forEach((node: any) => {
      if (node.x !== undefined && node.y !== undefined) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      }
    });

    // Add padding
    const padding = 100;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const svgWidth = parseFloat(svg.attr("width"));
    const svgHeight = parseFloat(svg.attr("height"));

    // Calculate scale to fit the bounding box
    const scale =
      Math.min(
        svgWidth / width,
        svgHeight / height,
        2, // Max zoom level for initial view
      ) * 0.9; // 90% to ensure everything fits comfortably

    // Calculate the transform to center the graph
    const x = svgWidth / 2 - scale * centerX;
    const y = svgHeight / 2 - scale * centerY;

    // Animate to the new transform
    svg
      .transition()
      .duration(750)
      .call(
        zoomBehavior.transform as any,
        d3.zoomIdentity.translate(x, y).scale(scale),
      );
  }

  function initializeGraph() {
    if (!container) return;

    // Clear previous content
    d3.select(container).selectAll("*").remove();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Validate graph data - check for orphaned edges
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const invalidEdges = graph.edges.filter(
      (e) => !nodeIds.has(e.source) || !nodeIds.has(e.target),
    );

    if (invalidEdges.length > 0) {
      console.warn(
        `Found ${invalidEdges.length} edges with invalid node references:`,
        invalidEdges.slice(0, 5),
      );
    }

    // Filter out edges that reference non-existent nodes
    const validEdges = graph.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
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

    zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        currentTransform = event.transform;
        resetIdleTimer();
      });

    svg.call(zoomBehavior);

    // Click on background to deselect
    svg.on("click", () => {
      if (selectedNodeId) {
        selectedNodeId = null;
        selectedNode = null;
        hideDetailPanel();
        // Reset all edges to normal
        link
          .attr("stroke-opacity", 0.3)
          .attr("filter", "none")
          .attr("stroke-width", 1.5);
      }
    });

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

    // Glow filter for highlighted edges (optimized)
    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create force simulation
    // D3's forceLink expects edges with source/target (our format already uses this)
    const d3Edges = validEdges.map((e) => ({
      source: e.source,
      target: e.target,
      kind: e.kind,
    }));

    simulation = d3
      .forceSimulation(graph.nodes as any)
      .force(
        "link",
        d3
          .forceLink(d3Edges as any)
          .id((d: any) => d.id)
          .distance(150)
          .strength(0.3),
      )
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(0, 0).strength(0.05))
      .force("collision", d3.forceCollide().radius(50));

    // Create edges
    const link = g
      .append("g")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(d3Edges)
      .join("line")
      .attr("stroke", (d) => edgeColors[d.kind as GraphEdgeKind] || "#999")
      .attr("stroke-width", 1.5)
      .attr("marker-end", (d) => `url(#arrow-${d.kind})`)
      .attr("class", "graph-edge")
      .attr("filter", "none")
      .style(
        "transition",
        "stroke-opacity 0.15s ease, stroke-width 0.15s ease",
      );

    // Store reference for use in modal
    linkSelection = link;

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
        resetIdleTimer();

        // Toggle selection
        if (selectedNodeId === d.id) {
          selectedNodeId = null;
          selectedNode = null;
          hideDetailPanel();
          // Reset all edges to normal
          link
            .attr("stroke-opacity", 0.3)
            .attr("filter", "none")
            .attr("stroke-width", 1.5);
        } else {
          selectedNodeId = d.id;
          selectedNode = d;
          renderDetailPanel(d);
          // Highlight connected edges
          link.each(function (linkData: any) {
            const isConnected =
              linkData.source.id === d.id || linkData.target.id === d.id;
            const elem = d3.select(this);

            if (isConnected) {
              elem
                .attr("stroke-opacity", 0.9)
                .attr("filter", "url(#glow)")
                .attr("stroke-width", 2.5);
            } else {
              elem.attr("stroke-opacity", 0.1);
            }
          });
        }
      })
      .call(
        d3
          .drag<SVGCircleElement, VisualizationNode>()
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

    // Create detail panel group (world-space)
    detailPanelGroup = g.append("g").attr("class", "detail-panel").style("display", "none");

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
      .on("mouseenter", (event, d) => {
        // Skip if dragging, node selected, or this is a touch device (mobile)
        if (isDragging || selectedNodeId || isMobile) return;

        // Check if this is a real mouse event (not touch)
        // Touch events have pointerType 'touch' or sourceCapabilities
        const isTouch = event.sourceEvent?.pointerType === 'touch' ||
                       event.sourceEvent?.type?.startsWith('touch') ||
                       'ontouchstart' in window;

        if (isTouch) return;

        // Only update if we're hovering a different node
        if (hoveredNodeId === d.id) return;
        hoveredNodeId = d.id;
        resetIdleTimer();

        tooltip.style("visibility", "visible").html(
          `
            <div class="font-semibold">${d.name}</div>
            <div class="text-xs text-gray-300 mt-1">
              <div>Type: ${d.kind}</div>
              <div>Role: ${d.role}</div>
              <div>File: ${d.file.split("/").pop()}</div>
              <div>Line: ${d.line}</div>
              <div>Importance: ${d.importance.toFixed(1)}</div>
              <div>Fan-in: ${d.fan_in} | Fan-out: ${d.fan_out}</div>
              ${d.complexity ? `<div>Complexity: ${d.complexity}</div>` : ''}
            </div>
          `,
        );

        // Highlight connected edges - batch updates for performance
        link.each(function (linkData: any) {
          const isConnected =
            linkData.source.id === d.id || linkData.target.id === d.id;
          const elem = d3.select(this);

          if (isConnected) {
            elem
              .attr("stroke-opacity", 0.9)
              .attr("filter", "url(#glow)")
              .attr("stroke-width", 2.5);
          } else {
            elem.attr("stroke-opacity", 0.1);
          }
        });
      })
      .on("mousemove", (event) => {
        // Only move tooltip if it's visible and not on mobile
        if (isMobile || selectedNodeId) return;

        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", () => {
        // Don't reset if a node is selected
        if (selectedNodeId) return;

        hoveredNodeId = null;
        tooltip.style("visibility", "hidden");

        // Reset all edges to normal - batch update
        link
          .attr("stroke-opacity", 0.3)
          .attr("filter", "none")
          .attr("stroke-width", 1.5);
      });

    // Update positions on simulation tick
    if (!simulation) return;

    let hasInitiallyZoomed = false;
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);

      // After first few ticks, zoom to fit once
      if (!hasInitiallyZoomed && simulation && simulation.alpha() < 0.8) {
        hasInitiallyZoomed = true;
        setTimeout(() => {
          zoomToFit();
          resetIdleTimer();
        }, 50);
      }
    });

    function dragstarted(
      event: d3.D3DragEvent<SVGCircleElement, VisualizationNode, VisualizationNode>,
    ) {
      isDragging = true;
      hoveredNodeId = null;
      resetIdleTimer();

      // Reset all edges when dragging starts
      link
        .attr("stroke-opacity", 0.3)
        .attr("filter", "none")
        .attr("stroke-width", 1.5);

      if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
      const s: any = event.subject;
      s.fx = s.x;
      s.fy = s.y;
    }

    function dragged(
      event: d3.D3DragEvent<SVGCircleElement, VisualizationNode, VisualizationNode>,
    ) {
      resetIdleTimer();
      const s: any = event.subject;
      s.fx = event.x;
      s.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGCircleElement, VisualizationNode, VisualizationNode>,
    ) {
      isDragging = false;

      if (!event.active && simulation) simulation.alphaTarget(0);
      const s: any = event.subject;
      s.fx = null;
      s.fy = null;
    }

    function renderDetailPanel(node: VisualizationNode) {
      if (!detailPanelGroup) return;

      // Hide tooltip when opening detail panel
      tooltip.style("visibility", "hidden");
      hoveredNodeId = null;

      // Clear previous panel
      detailPanelGroup.selectAll("*").remove();
      detailPanelGroup.style("display", "block");

      const nodeData: any = simulation?.nodes().find((n: any) => n.id === node.id);
      if (!nodeData || nodeData.x === undefined || nodeData.y === undefined) return;

      const panelWidth = 200;
      const panelHeight = onNodeClick ? 165 : 140; // Taller if button exists
      const offset = 30; // Distance from node
      const nodeX = nodeData.x;
      const nodeY = nodeData.y;

      // Position panel to the right of the node (or left if near edge)
      // Smart positioning: check if we should place it to the left
      const placeLeft = nodeX > 0; // Simple heuristic: if node is on right side, place panel on left
      const panelX = placeLeft ? nodeX - offset - panelWidth : nodeX + offset;
      const panelY = nodeY - panelHeight / 2;

      // Connection line from node to panel
      detailPanelGroup
        .append("line")
        .attr("x1", nodeX)
        .attr("y1", nodeY)
        .attr("x2", panelX)
        .attr("y2", panelY + panelHeight / 2)
        .attr("stroke", roleColors[node.role])
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.6);

      // Panel background with border
      detailPanelGroup
        .append("rect")
        .attr("x", panelX)
        .attr("y", panelY)
        .attr("width", panelWidth)
        .attr("height", panelHeight)
        .attr("fill", "#1f2937")
        .attr("stroke", roleColors[node.role])
        .attr("stroke-width", 2)
        .attr("rx", 6)
        .attr("opacity", 0.95);

      // Node name (title)
      detailPanelGroup
        .append("text")
        .attr("x", panelX + 10)
        .attr("y", panelY + 20)
        .attr("fill", "#f3f4f6")
        .attr("font-size", 12)
        .attr("font-weight", "600")
        .text(node.name.length > 22 ? node.name.substring(0, 22) + "..." : node.name);

      // Role indicator
      detailPanelGroup
        .append("circle")
        .attr("cx", panelX + 10)
        .attr("cy", panelY + 34)
        .attr("r", 4)
        .attr("fill", roleColors[node.role]);

      detailPanelGroup
        .append("text")
        .attr("x", panelX + 20)
        .attr("y", panelY + 38)
        .attr("fill", "#9ca3af")
        .attr("font-size", 9)
        .text(node.role);

      // Condensed details
      const details = [
        { label: "Type", value: node.kind },
        { label: "File", value: node.file.split("/").pop() || "" },
        { label: "Importance", value: node.importance.toFixed(1) },
        { label: "Connections", value: `${node.fan_in}↓ ${node.fan_out}↑` },
      ];

      details.forEach((detail, i) => {
        const y = panelY + 56 + i * 18;

        detailPanelGroup
          .append("text")
          .attr("x", panelX + 10)
          .attr("y", y)
          .attr("fill", "#6b7280")
          .attr("font-size", 9)
          .text(detail.label + ":");

        detailPanelGroup
          .append("text")
          .attr("x", panelX + 75)
          .attr("y", y)
          .attr("fill", "#e5e7eb")
          .attr("font-size", 9)
          .text(detail.value.length > 16 ? detail.value.substring(0, 16) + "..." : detail.value);
      });

      // Close button (small X)
      const closeBtn = detailPanelGroup.append("g")
        .attr("class", "close-btn")
        .attr("cursor", "pointer")
        .on("click", () => {
          selectedNodeId = null;
          selectedNode = null;
          detailPanelGroup.style("display", "none");
          // Reset edges
          link
            .attr("stroke-opacity", 0.3)
            .attr("filter", "none")
            .attr("stroke-width", 1.5);
        });

      closeBtn
        .append("circle")
        .attr("cx", panelX + panelWidth - 15)
        .attr("cy", panelY + 15)
        .attr("r", 8)
        .attr("fill", "#374151")
        .attr("opacity", 0.8);

      closeBtn
        .append("path")
        .attr("d", `M ${panelX + panelWidth - 18},${panelY + 12} L ${panelX + panelWidth - 12},${panelY + 18} M ${panelX + panelWidth - 18},${panelY + 18} L ${panelX + panelWidth - 12},${panelY + 12}`)
        .attr("stroke", "#9ca3af")
        .attr("stroke-width", 1.5)
        .attr("stroke-linecap", "round");

      // "View Symbol" button (if onNodeClick exists)
      if (onNodeClick) {
        const viewBtn = detailPanelGroup.append("g")
          .attr("class", "view-btn")
          .attr("cursor", "pointer")
          .on("click", () => {
            onNodeClick(node.id);
            selectedNodeId = null;
            selectedNode = null;
            detailPanelGroup.style("display", "none");
            // Reset edges
            link
              .attr("stroke-opacity", 0.3)
              .attr("filter", "none")
              .attr("stroke-width", 1.5);
          });

        viewBtn
          .append("rect")
          .attr("x", panelX + 10)
          .attr("y", panelY + panelHeight - 28)
          .attr("width", panelWidth - 20)
          .attr("height", 20)
          .attr("fill", "#2563eb")
          .attr("rx", 4)
          .attr("opacity", 0.9);

        viewBtn
          .append("text")
          .attr("x", panelX + panelWidth / 2)
          .attr("y", panelY + panelHeight - 15)
          .attr("fill", "#ffffff")
          .attr("font-size", 9)
          .attr("text-anchor", "middle")
          .attr("font-weight", "500")
          .text("View in Symbol List");

        // Hover effect
        const btnRect = viewBtn.select("rect");
        viewBtn.on("mouseenter", () => {
          btnRect.attr("opacity", 1);
        }).on("mouseleave", () => {
          btnRect.attr("opacity", 0.9);
        });
      }
    }

    function hideDetailPanel() {
      if (detailPanelGroup) {
        detailPanelGroup.style("display", "none");
      }
    }
  }
</script>

<div class="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
  <div bind:this={container} class="w-full h-full"></div>

  <!-- Control Buttons -->
  <div class="absolute top-24 md:top-14 left-4 flex flex-col gap-2">
    <!-- Home Button -->
    <button
      onclick={() => zoomToFit()}
      class="bg-gray-800 bg-opacity-90 hover:bg-gray-700 p-2.5 md:p-3 rounded-lg text-gray-200 transition-colors duration-200 shadow-lg touch-manipulation"
      title="Reset view"
      aria-label="Reset view"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 md:h-5 md:w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    </button>

    <!-- Toggle Legend Button (Mobile) -->
    <button
      onclick={() => (showLegend = !showLegend)}
      class="md:hidden bg-gray-800 bg-opacity-90 hover:bg-gray-700 p-2.5 rounded-lg text-gray-200 transition-colors duration-200 shadow-lg touch-manipulation"
      title="Toggle legend"
      aria-label="Toggle legend"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>

    <!-- Toggle Stats Button (Mobile) -->
    <button
      onclick={() => (showStats = !showStats)}
      class="md:hidden bg-gray-800 bg-opacity-90 hover:bg-gray-700 p-2.5 rounded-lg text-gray-200 transition-colors duration-200 shadow-lg touch-manipulation"
      title="Toggle stats"
      aria-label="Toggle stats"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </button>
  </div>

  <!-- Legend -->
  {#if showLegend || !isMobile}
    <div
      class="absolute top-24 md:top-14 right-4 bg-gray-800 bg-opacity-95 p-3 md:p-4 rounded-lg text-xs text-gray-200 max-w-[280px] md:max-w-xs shadow-xl max-h-[70vh] overflow-y-auto"
    >
      <div class="flex justify-between items-center mb-2">
        <div class="font-semibold">Node Roles</div>
        <button
          onclick={() => (showLegend = false)}
          class="md:hidden text-gray-400 hover:text-gray-200"
          aria-label="Close legend"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="space-y-1">
        {#each Object.entries(roleColors) as [role, color]}
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full shrink-0"
              style="background-color: {color}"
            ></div>
            <span class="text-[10px] md:text-xs">{role}</span>
          </div>
        {/each}
      </div>

      <div class="font-semibold mt-3 md:mt-4 mb-2">Edge Types</div>
      <div class="space-y-1">
        {#each Object.entries(edgeColors) as [type, color]}
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-0.5 shrink-0"
              style="background-color: {color}"
            ></div>
            <span class="text-[10px] md:text-xs">{type}</span>
          </div>
        {/each}
      </div>

      <div
        class="mt-3 md:mt-4 text-gray-400 text-[10px] md:text-xs space-y-0.5"
      >
        <div>• Node size = importance</div>
        <div>• Drag nodes to reposition</div>
        <div>
          • <span class="hidden md:inline">Scroll</span><span class="md:hidden"
            >Pinch</span
          > to zoom
        </div>
        <div>• Tap node to select & highlight</div>
        <div>• Tap again to deselect</div>
      </div>
    </div>
  {/if}

  <!-- Stats Panel -->
  {#if showStats || !isMobile}
    <div
      class="absolute bottom-4 left-4 bg-gray-800 bg-opacity-95 p-3 md:p-4 rounded-lg text-xs text-gray-200 shadow-xl"
    >
      <div class="flex justify-between items-center mb-2">
        <div class="font-semibold text-[10px] md:text-xs">Graph Statistics</div>
        <button
          onclick={() => (showStats = false)}
          class="md:hidden text-gray-400 hover:text-gray-200"
          aria-label="Close stats"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="space-y-1 text-[10px] md:text-xs">
        <div>Nodes: {graph.stats.node_count}</div>
        <div>Edges: {graph.stats.edge_count}</div>
        <div>Functions: {graph.stats.function_count}</div>
        <div>Types: {graph.stats.type_count}</div>
        {#if graph.stats.cluster_count > 0}
          <div>Clusters: {graph.stats.cluster_count}</div>
        {/if}
        <div class="text-[9px] text-gray-400 mt-1">
          {graph.stats.languages.join(', ')}
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  :global(.tooltip) {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  /* Improve touch interactions */
  :global(svg) {
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Ensure buttons are large enough for touch */
  :global(button.touch-manipulation) {
    -webkit-tap-highlight-color: transparent;
    min-width: 44px;
    min-height: 44px;
  }
</style>
