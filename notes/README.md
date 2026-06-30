# Notes

A small, build-step-free notes section. Each note is a Markdown file rendered
in the browser with [marked](https://marked.js.org/) + [KaTeX](https://katex.org/).

## Add a note

1. Create `notes/<slug>.md` and write the note in Markdown. (Don't put the
   title in the file — it comes from `notes.json`.)
2. Add an entry to `notes.json`:
   ```json
   { "slug": "<slug>", "title": "Your Title", "date": "2026-06-30" }
   ```
   `slug` must match the filename and contain only letters, numbers, `-`, `_`.
   `date` is `YYYY-MM-DD`; the index sorts newest-first by it.

That's it. The note is live at `/notes/note.html?n=<slug>` and shows up on
`/notes/`.

## What you can write

- **Markdown** — headings (`##`, `###`), **bold**, *italic*, lists, `code`,
  blockquotes, links, images.
- **LaTeX** — `$inline$` and `$$display$$`, rendered by KaTeX.
- **Footnotes** — reference with `[^id]`, define with `[^id]: text`. Each
  footnote gets a `←` link back to where it was referenced. Numbered in
  first-reference order.
- **Raw HTML / iframes** — paste an `<iframe>` (charts, maps, video) right into
  the Markdown.

See `_template.md` for a live demo of all of the above (it's hidden from the
list because its slug starts with `_`; view hidden notes at `/notes/?all`).

## Files

- `index.html` — the "Notes" list page (reads `notes.json`).
- `note.html` — the shared template that displays one note.
- `note.js` — fetches the `.md`, renders Markdown + LaTeX + footnotes.
- `note.css` — styling for the list and a single note.
- `notes.json` — the manifest (title/date/slug for each note).
