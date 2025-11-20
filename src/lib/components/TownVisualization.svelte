<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import * as d3 from "d3";

  interface TownUser {
    id: string;
    github_login: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
  }

  interface Props {
    users: TownUser[];
    currentUserId?: string;
    hasActiveSubscription?: boolean;
  }

  let { users, currentUserId, hasActiveSubscription }: Props = $props();

  let container: HTMLDivElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let simulation: d3.Simulation<any, any> | null = null;
  let hoveredUserId: string | null = null;
  let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  let isMobile = $state(false);
  let isDragging = false;

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
  });

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
    const padding = 150;
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

  function zoomToUser() {
    if (!svg || !zoomBehavior || !simulation || !currentUserId) return;

    const nodes = simulation.nodes();
    const userNode = nodes.find((n: any) => n.id === currentUserId);

    if (!userNode || userNode.x === undefined || userNode.y === undefined) return;

    const svgWidth = parseFloat(svg.attr("width"));
    const svgHeight = parseFloat(svg.attr("height"));

    // Zoom to the user's node with a nice scale
    const scale = 1.5;
    const x = svgWidth / 2 - scale * userNode.x;
    const y = svgHeight / 2 - scale * userNode.y;

    // Animate to the user's node
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

    // Create SVG
    svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0a0b0d");

    // Add zoom behavior
    const g = svg.append("g");

    // Create subtle grid pattern
    const gridSize = 80;
    const gridExtent = 4096;

    const gridGroup = g.append("g").attr("class", "grid");

    // Vertical lines
    for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", -gridExtent)
        .attr("x2", x)
        .attr("y2", gridExtent)
        .attr("stroke", x === 0 ? "#1e293b" : "#0f172a")
        .attr("stroke-width", x === 0 ? 1.5 : 0.5)
        .attr("opacity", 0.4);
    }

    // Horizontal lines
    for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", -gridExtent)
        .attr("y1", y)
        .attr("x2", gridExtent)
        .attr("y2", y)
        .attr("stroke", y === 0 ? "#1e293b" : "#0f172a")
        .attr("stroke-width", y === 0 ? 1.5 : 0.5)
        .attr("opacity", 0.4);
    }

    zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    // Add glow filter for avatars
    const defs = svg.append("defs");

    const filter = defs
      .append("filter")
      .attr("id", "avatar-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create clipPath for circular avatars
    defs
      .append("clipPath")
      .attr("id", "avatar-clip")
      .append("circle")
      .attr("r", 24);

    // Create links connecting users by join date (chronological chain)
    const links = [];
    for (let i = 0; i < users.length - 1; i++) {
      links.push({
        source: users[i].id,
        target: users[i + 1].id,
        index: i + 1, // Index of the connection (1-based)
      });
    }

    // Create force simulation with BOUNCY SPRINGY physics!
    simulation = d3
      .forceSimulation(users as any)
      .alphaDecay(0.01) // Slower decay = more bouncing around
      .velocityDecay(0.3) // Less friction = more sploingy momentum
      .force(
        "link",
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance(150) // Longer springs
          .strength(0.4), // Weaker = more elastic and bouncy
      )
      .force("charge", d3.forceManyBody().strength(-300)) // Stronger repulsion = more bouncing
      .force("center", d3.forceCenter(0, 0).strength(0.05)) // Weak centering for more freedom
      .force("collision", d3.forceCollide().radius(70).strength(0.9)); // Bouncy collisions

    // Create links (lines connecting users in chronological order)
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5);

    // Create labels on edges showing the connection index
    const linkLabel = g
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("font-size", 11)
      .attr("font-weight", "600")
      .attr("fill", "#60a5fa")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none")
      .attr("dy", -3) // Offset above the line
      .text((d: any) => d.index);

    // Create node groups
    const nodeGroup = g
      .append("g")
      .selectAll("g")
      .data(users)
      .join("g")
      .attr("class", "user-node cursor-pointer")
      .call(
        d3
          .drag<SVGGElement, TownUser>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any,
      );

    // Add avatar circles with border
    nodeGroup
      .append("circle")
      .attr("r", 26)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("filter", "url(#avatar-glow)");

    // Add avatar images
    nodeGroup
      .append("image")
      .attr("xlink:href", (d) => d.avatar_url || "")
      .attr("x", -24)
      .attr("y", -24)
      .attr("width", 48)
      .attr("height", 48)
      .attr("clip-path", "url(#avatar-clip)");

    // Add user names as labels
    nodeGroup
      .append("text")
      .text((d) => d.name || d.github_login)
      .attr("font-size", 12)
      .attr("dy", 45)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("pointer-events", "none")
      .attr("font-weight", "500");

    // Tooltip
    const tooltip = d3
      .select(container)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.95)")
      .style("color", "#fff")
      .style("padding", "12px 16px")
      .style("border-radius", "8px")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("border", "1px solid #3b82f6");

    nodeGroup
      .on("mouseenter", (event, d) => {
        if (isMobile || isDragging) return;

        hoveredUserId = d.id;
        tooltip.style("visibility", "visible").html(
          `
            <div class="font-semibold text-lg">${d.name || d.github_login}</div>
            <div class="text-sm text-gray-300 mt-1">@${d.github_login}</div>
          `,
        );

        // Highlight the node
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(200)
          .attr("stroke-width", 3)
          .attr("r", 28);
      })
      .on("mousemove", (event) => {
        if (isMobile || isDragging) return;

        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseleave", (event) => {
        hoveredUserId = null;
        tooltip.style("visibility", "hidden");

        // Reset the node
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(200)
          .attr("stroke-width", 2)
          .attr("r", 26);
      })
      .on("click", (event, d) => {
        // Open GitHub profile in new tab
        if (d.github_login) {
          window.open(`https://github.com/${d.github_login}`, "_blank");
        }
      });

    // Update positions on simulation tick
    if (!simulation) return;

    simulation.on("tick", () => {
      // Update link positions
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      // Update link label positions (at midpoint of each link)
      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      // Update node positions
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(
      event: d3.D3DragEvent<SVGGElement, TownUser, TownUser>,
    ) {
      isDragging = true;
      hoveredUserId = null;
      tooltip.style("visibility", "hidden");

      // Super bouncy restart with high energy!
      if (!event.active && simulation) simulation.alphaTarget(0.5).restart();
      const s: any = event.subject;
      s.fx = s.x;
      s.fy = s.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, TownUser, TownUser>) {
      const s: any = event.subject;
      s.fx = event.x;
      s.fy = event.y;
    }

    function dragended(
      event: d3.D3DragEvent<SVGGElement, TownUser, TownUser>,
    ) {
      isDragging = false;

      // Let it keep bouncing after release!
      if (!event.active && simulation) simulation.alphaTarget(0.1);
      const s: any = event.subject;
      s.fx = null;
      s.fy = null;
    }
  }
</script>

<div class="relative w-full h-full bg-gray-950 rounded-lg overflow-hidden">
  <div bind:this={container} class="w-full h-full"></div>

  <!-- Control Buttons -->
  {#if currentUserId && hasActiveSubscription}
    <div class="absolute top-4 left-4 flex flex-col gap-2">
      <!-- Find Me Button (Pro only) -->
      <button
        onclick={() => zoomToUser()}
        class="bg-blue-600 bg-opacity-90 hover:bg-blue-500 p-2.5 md:p-3 rounded-lg text-white transition-colors duration-200 shadow-lg touch-manipulation"
        title="Find me in Town"
        aria-label="Find me in Town"
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
    </div>
  {/if}

  <!-- Info Panel -->
  <div
    class="absolute top-4 right-4 bg-gray-800 bg-opacity-95 p-4 rounded-lg text-gray-200 shadow-xl max-w-xs"
  >
    <div class="font-semibold text-lg mb-2">Welcome to Town!</div>
    <div class="text-sm text-gray-300 space-y-1">
      <div>🏘️ {users.length} residents</div>
      <div class="text-xs text-blue-400 mt-1">⛓️ Connected by join date</div>
      <div class="mt-3 text-xs text-gray-400">
        <div>• Drag nodes to move them</div>
        <div>• {isMobile ? "Pinch" : "Scroll"} to zoom</div>
        <div>• Click to visit GitHub profile</div>
        {#if currentUserId && hasActiveSubscription}
          <div class="text-blue-400 mt-2">✨ Click home to find yourself!</div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  :global(.tooltip) {
    font-family:
      ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI";
  }

  :global(svg) {
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  :global(button.touch-manipulation) {
    -webkit-tap-highlight-color: transparent;
    min-width: 44px;
    min-height: 44px;
  }
</style>
