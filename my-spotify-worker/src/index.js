// src/index.js
export default {
  async fetch(req, env) {
    // 1) Refresh access token using your stored refresh token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {"Content-Type":"application/x-www-form-urlencoded"},
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: env.SPOTIFY_REFRESH_TOKEN,
        client_id: env.SPOTIFY_CLIENT_ID,
        client_secret: env.SPOTIFY_CLIENT_SECRET
      })
    });
    if (!tokenRes.ok) {
      return json({ error: "token_fail" }, 500);
    }
    const { access_token } = await tokenRes.json();

    // 2) Fetch most recent track (tracks only; not podcasts)
    const r = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!r.ok) {
      return json({ error: "recent_fail" }, 500);
    }
    const data = await r.json();
    const item = data.items?.[0];
    const t = item?.track;

    // 3) Minimal payload for your site
    const payload = t ? {
      title: t.name,
      artists: t.artists.map(a => a.name).join(", "),
      album: t.album.name,
      cover: t.album.images?.[0]?.url || null,
      played_at: item.played_at,
      url: t.external_urls?.spotify || null
    } : {};

    return json(payload, 200, { "Cache-Control": "max-age=30" }); // 30s CDN cache
  }
};

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json",
               "Access-Control-Allow-Origin": "*",
               "Access-Control-Allow-Methods": "GET, OPTIONS",
               ...extra }
  });
}