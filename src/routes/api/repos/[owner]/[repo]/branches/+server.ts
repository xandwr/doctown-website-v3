import type { RequestHandler } from "./$types";

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
  protected: boolean;
}

interface BranchInfo {
  name: string;
  commit_sha: string;
  protected: boolean;
  is_default: boolean;
}

// Simple in-memory cache with 60-second TTL
const branchCache = new Map<
  string,
  { data: BranchInfo[]; timestamp: number }
>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * GET /api/repos/[owner]/[repo]/branches
 *
 * Fetches all branches for a repository using the user's GitHub OAuth token.
 * Returns branch names with their commit SHAs and protection status.
 * Results are cached for 60 seconds to avoid rate limiting.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { owner, repo } = params;

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "Missing owner or repo parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const cacheKey = `${owner}/${repo}`;
    const now = Date.now();

    // Check cache first
    const cached = branchCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ branches: cached.data }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    // Fetch default branch info first
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${locals.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        return new Response(JSON.stringify({ error: "Repository not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`GitHub API error: ${repoResponse.status}`);
    }

    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch;

    // Fetch branches (GitHub returns up to 100 per page)
    const branchesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${locals.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!branchesResponse.ok) {
      throw new Error(`GitHub API error: ${branchesResponse.status}`);
    }

    const githubBranches: GitHubBranch[] = await branchesResponse.json();

    // Transform to our format
    const branches: BranchInfo[] = githubBranches.map((branch) => ({
      name: branch.name,
      commit_sha: branch.commit.sha,
      protected: branch.protected,
      is_default: branch.name === defaultBranch,
    }));

    // Sort: default branch first, then alphabetically
    branches.sort((a, b) => {
      if (a.is_default) return -1;
      if (b.is_default) return 1;
      return a.name.localeCompare(b.name);
    });

    // Cache the results
    branchCache.set(cacheKey, { data: branches, timestamp: now });

    return new Response(JSON.stringify({ branches }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch branches",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
