# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website for benpomeranz.com, hosted on GitHub Pages. Static HTML site with two Cloudflare Workers backends.

## Architecture

### Frontend (GitHub Pages)
- **Static HTML pages**: `index.html`, `now.html`, `contact.html` — plain HTML with shared `styles.css` and `nav.html` (fetched client-side)
- **Achievements page** (`achievements/index.html`): Self-contained single-file app (~3500 lines). Canvas-based interactive achievement tree with force-directed graph layout, pan/zoom, search, edit mode, confetti, signature drawings, per-person notes, undo, and auth-gated saving
- **Achievements data** (`achievements/achievements.csv`): CSV with RFC 4180 quoting. Columns: `id,name,description,prerequisites,target,{player}_completed,{player}_progress,{player}_notes` for each player (bentzi/adin/ben). Prerequisites are pipe-delimited IDs
- **Signatures** (`achievements/signatures.json`): Stroke data for per-player completion drawings. Keyed by `{achievementId}_{player}`. Stored/loaded via the worker's `?file=signatures` endpoint

### Cloudflare Workers
- **`achievements-worker/`**: Validates password (SHA-256), reads/writes files (`csv` and `signatures`) via GitHub Contents API with optimistic locking (SHA-based). GET `?file=signatures` for signatures, default is CSV. Deploy: `cd achievements-worker && npx wrangler deploy`. Secrets: `PASSWORD_HASH`, `GITHUB_TOKEN` (set via `wrangler secret put`)
- **`my-spotify-worker/`**: Spotify "recently played" widget for the Now page. Deploy: `cd my-spotify-worker && npx wrangler deploy`

### Data Flow
Achievements page loads CSV and signatures from Worker GET endpoints (falls back to static files). Authenticated saves POST through the Worker, which commits to GitHub via the Contents API. Node positions are stored in `localStorage`, not in the CSV. Signatures are stored in a separate `signatures.json` file.

## Development

No build step for the frontend — edit HTML/CSS/JS directly and open in browser. For Workers:
```
cd achievements-worker && npm install && npx wrangler dev   # local dev server
cd my-spotify-worker && npm install && npx wrangler dev
```

`auth_once.js` is a one-time Spotify OAuth token minter (run with `node auth_once.js` with env vars `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`).

## Key Patterns

- The achievements page is a single HTML file with all CSS and JS inline — no bundler, no framework
- Achievement nodes are drawn on `<canvas>` (not DOM elements), so text rendering, hit detection, and layout are all manual
- Three players: Bentzi, Adin, Ben — each with independent completion/progress tracking
- Achievements can be binary (target=1) or progress-based (target>1 with progress counters)
- Edit mode (press E when authenticated) enables adding nodes, connecting prerequisites, and repositioning
- Per-person notes are stored in dedicated CSV columns (`bentzi_notes`, `adin_notes`, `ben_notes`), not inline in descriptions
- Signature drawings use stroke data (100x100 coordinate space) stored in `signatures.json`, rendered at various sizes via `renderSignature()`
- Undo stack (Cmd+Z) tracks completion toggles, progress changes, note edits, signature saves, and node moves
