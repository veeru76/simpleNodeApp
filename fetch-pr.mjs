import { analyzeDiff } from "./analyze-diff.mjs";

// --- Parse PR URL ---
function parsePrUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error(`Invalid GitHub PR URL: ${url}`);
  return { owner: match[1], repo: match[2], pullNumber: match[3] };
}

// --- Fetch changed files via GitHub REST API ---
async function fetchPrFiles(owner, repo, pullNumber, token) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`,
    {
      headers: {
        "User-Agent": "node-pr-fetcher",
        Accept: "application/vnd.github.v3+json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res.json();
}

// --- Format diff output ---
function formatDiff(files) {
  return files
    .filter(f => f.patch) // skip empty patches
    .map(f => {
      return `File: ${f.filename}\n\nGit Diff:\n${f.patch}`;
    });
}

// --- Main ---
const prUrl = process.argv[2];
if (!prUrl) {
  console.error("Usage: node fetch-pr.mjs <PR_URL>");
  console.error("Example: node fetch-pr.mjs https://github.com/owner/repo/pull/123");
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.warn("Warning: GITHUB_TOKEN not set. API rate limits will be very low.\n");
}

try {
  const { owner, repo, pullNumber } = parsePrUrl(prUrl);
  console.error(`Fetching files for ${owner}/${repo}#${pullNumber}...\n`);

  const files = await fetchPrFiles(owner, repo, pullNumber, token);

  const diffs = formatDiff(files);
  const diffText = diffs.join("\n\n---\n\n");

  console.log(diffText);
  console.log("\n========== AI Code Review ==========\n");

  const review = await analyzeDiff(diffText);

  if (review) {
    console.log(`Summary: ${review.summary}`);
    console.log(`Approved: ${review.approved ? "✅ Yes" : "❌ No"}\n`);

    if (review.issues?.length) {
      console.log("Issues:");
      for (const issue of review.issues) {
        const icon = issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "🔵";
        console.log(`  ${icon} [${issue.severity}] ${issue.file}:${issue.line}`);
        console.log(`     ${issue.message}\n`);
      }
    } else {
      console.log("No issues found. 🎉");
    }
  } else {
    console.error("AI review failed. See errors above.");
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
