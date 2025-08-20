// auth_once.js — one-time token mint
// Note: Node 18+ provides a global `fetch`, so no extra package is needed.
import express from "express";
import open from "open";
import crypto from "crypto";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPE = "user-read-recently-played";

const app = express();
const state = crypto.randomBytes(16).toString("hex");

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.status(400).send("No code.");
    return;
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code.toString(),
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const json = await r.json();
  if (!r.ok) {
    console.error(json);
    res.status(500).send("Token exchange failed.");
    return;
  }
  console.log("\nREFRESH_TOKEN =", json.refresh_token, "\n");
  res.send("All set — refresh token printed in your terminal. You can close this.");
  process.exit(0);
});

app.listen(8888, async () => {
  const auth = new URL("https://accounts.spotify.com/authorize");
  auth.searchParams.set("client_id", CLIENT_ID);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("redirect_uri", REDIRECT_URI);
  auth.searchParams.set("scope", SCOPE);
  auth.searchParams.set("state", state);
  await open(auth.toString());
  console.log("Listening on http://127.0.0.1:8888/callback …");
});

 