This note is a living reference for everything the notes template can do. Copy it, rename it, and start writing. (It's hidden from the main list because its slug starts with `_`; you can see hidden notes at [/notes/?all](/notes/?all).)

## Markdown basics

You write notes in plain **Markdown**: **bold**, *italic*, `inline code`, and [links](https://benpomeranz.com) all work. Lists too:

- a bullet
- another bullet
  - and a nested one

1. first
2. second

> Block quotes look like this — handy for pulling out a key sentence.

Headers are `##` for sections and `###` for sub-sections.

## Math (LaTeX)

Use single dollar signs for **inline** math, like $e^{i\pi} + 1 = 0$ inside a sentence. Use double dollar signs for a **display** equation on its own line:

$$\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}$$

Math is rendered with KaTeX, so most of the usual LaTeX you'd write in a textbook works: $\frac{\partial f}{\partial x}$, $\sum_{k=0}^{n} \binom{n}{k}$, $\hat\theta$, and so on.

## Footnotes

Drop a marker like this[^why] anywhere in the text, then define it lower down. The footnote gets a number, and the `←` at the end of each footnote takes you back to where you were reading.[^second]

## Embedding an iframe

Raw HTML works inside Markdown, so you can embed things — a chart, a video, a Datawrapper graphic — by pasting an `<iframe>`:

<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-110.8,43.6,-110.6,43.8&layer=mapnik" height="320" title="Map demo"></iframe>

That's the whole toolkit: Markdown, LaTeX, footnotes, and iframes.

[^why]: Footnotes are great for asides you don't want cluttering the main thread of the argument.
[^second]: This is the second footnote. Footnotes are numbered in the order they're first referenced, not the order they're defined down here.
