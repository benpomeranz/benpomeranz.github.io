// Achievements Worker: validates password and commits CSV to GitHub repo
//
// Secrets (set via `wrangler secret put`):
//   PASSWORD_HASH  - SHA-256 hex hash of the shared password
//                    Generate with: echo -n "yourpassword" | shasum -a 256
//   GITHUB_TOKEN   - GitHub Fine-Grained Personal Access Token
//                    Scope: Contents read/write on benpomeranz.github.io repo ONLY
//
// Cost: Cloudflare Workers free tier = 100,000 requests/day. No risk of charges.

const REPO_OWNER = 'benpomeranz';
const REPO_NAME = 'benpomeranz.github.io';
const FILE_PATH = 'achievements/achievements.csv';
const BRANCH = 'main';
const MAX_CSV_SIZE = 50000; // 50KB max

export default {
  async fetch(req, env) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // Only POST allowed
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    try {
      const body = await req.text();
      if (body.length > MAX_CSV_SIZE + 1000) {
        return json({ error: 'Payload too large' }, 413);
      }

      const parsed = JSON.parse(body);
      const { password, action } = parsed;

      if (!password || typeof password !== 'string') {
        return json({ error: 'Missing password' }, 400);
      }

      // Validate password: SHA-256 hash comparison
      const encoder = new TextEncoder();
      const passwordHash = await crypto.subtle.digest('SHA-256', encoder.encode(password));
      const hashHex = [...new Uint8Array(passwordHash)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (!timingSafeEqual(hashHex, env.PASSWORD_HASH)) {
        return json({ error: 'Invalid password' }, 403);
      }

      // Verify-only mode: just check password, don't save
      if (action === 'verify') {
        return json({ success: true, verified: true });
      }

      // Save mode: commit CSV to GitHub
      const { csv } = parsed;

      if (!csv || typeof csv !== 'string') {
        return json({ error: 'Missing csv' }, 400);
      }
      if (csv.length > MAX_CSV_SIZE) {
        return json({ error: 'CSV too large' }, 413);
      }
      if (!csv.startsWith('id,name,description,prerequisites,')) {
        return json({ error: 'Invalid CSV format' }, 400);
      }

      // Get current file SHA (required by GitHub API for updates)
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
        {
          headers: {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'achievements-worker',
          },
        }
      );

      let sha = null;
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // Commit updated CSV
      const commitBody = {
        message: 'Update achievements data',
        content: btoa(unescape(encodeURIComponent(csv))),
        branch: BRANCH,
      };
      if (sha) commitBody.sha = sha;

      const putRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'achievements-worker',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commitBody),
        }
      );

      if (!putRes.ok) {
        const err = await putRes.text();
        console.error('GitHub API error:', err);
        return json({ error: 'Save failed' }, 500);
      }

      return json({ success: true });
    } catch (e) {
      return json({ error: 'Server error' }, 500);
    }
  },
};

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  // Password is the security layer, not CORS.
  // Allow all origins so local file:// and production both work.
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
