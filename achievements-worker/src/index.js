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

    // GET: return current CSV + SHA for optimistic locking
    if (req.method === 'GET') {
      return await handleGet(env);
    }

    // Only POST allowed for other operations
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    try {
      const body = await req.text();
      if (body.length > MAX_CSV_SIZE + 1000) {
        return json({ error: 'Payload too large' }, 413);
      }

      const parsed = JSON.parse(body);
      const { password, action, csv, sha: clientSha } = parsed;

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

      let currentSha = null;
      if (getRes.ok) {
        const fileData = await getRes.json();
        currentSha = fileData.sha;
      }

      // Optimistic locking: if the client sent the SHA they loaded from,
      // reject the save if someone else has updated the file since then.
      if (clientSha && currentSha && clientSha !== currentSha) {
        return json({
          error: 'conflict',
          message: 'Data was updated by someone else. Reload the page to get the latest changes.',
        }, 409);
      }

      // Commit updated CSV
      const commitBody = {
        message: 'Update achievements data',
        content: btoa(unescape(encodeURIComponent(csv))),
        branch: BRANCH,
      };
      if (currentSha) commitBody.sha = currentSha;

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
        // GitHub returns 422 for SHA conflicts (race condition between workers)
        if (putRes.status === 422 || putRes.status === 409) {
          return json({
            error: 'conflict',
            message: 'Data was updated by someone else. Reload the page to get the latest changes.',
          }, 409);
        }
        return json({ error: 'Save failed' }, 500);
      }

      // Return the new SHA so the client can track it for future saves
      const putData = await putRes.json();
      const newSha = putData.content?.sha ?? null;
      return json({ success: true, sha: newSha });
    } catch (e) {
      return json({ error: 'Server error' }, 500);
    }
  },
};

// GET handler: returns current CSV + SHA for optimistic locking
async function handleGet(env) {
  try {
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

    if (!getRes.ok) {
      return json({ error: 'Failed to load CSV from GitHub' }, 502);
    }

    const fileData = await getRes.json();
    // Decode base64 content (GitHub API encodes file content as base64) to UTF-8
    const csv = decodeBase64Utf8(fileData.content);
    return json({ csv, sha: fileData.sha });
  } catch (e) {
    return json({ error: 'Server error' }, 500);
  }
}

// Decode GitHub API base64-encoded file content to a UTF-8 string
function decodeBase64Utf8(base64) {
  const binaryStr = atob(base64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}
