/*
 * Renders a single note: fetches its Markdown, turns it into HTML with
 * marked, renders LaTeX with KaTeX ($ inline, $$ display), and builds a
 * footnotes section with ← back-arrows.
 *
 * To add a note: drop a `<slug>.md` file in /notes/ and add an entry to
 * notes.json. See README.md and _template.md.
 */
(function () {
    "use strict";

    // ---- which note? ------------------------------------------------------
    var slug = new URLSearchParams(location.search).get("n") || "";
    // keep slugs to a safe shape so ?n= can't reach outside /notes/
    if (!/^[A-Za-z0-9_-]+$/.test(slug)) {
        showError("Unknown note.");
        return;
    }

    // ---- footnote bookkeeping (reset per render) --------------------------
    var fnDefs = {};      // id -> raw markdown of the definition
    var fnNumbers = {};   // id -> assigned number
    var fnOrder = [];     // ids in first-reference order
    var fnCounter = 0;

    // ---- marked extensions: math + footnotes ------------------------------
    // Display math: $$ ... $$  (checked before inline so $$ wins over $)
    var displayMath = {
        name: "displayMath",
        level: "inline",
        start: function (src) { var i = src.indexOf("$$"); return i < 0 ? undefined : i; },
        tokenizer: function (src) {
            var m = /^\$\$([\s\S]+?)\$\$/.exec(src);
            if (m) return { type: "displayMath", raw: m[0], text: m[1].trim() };
        },
        renderer: function (t) { return tex(t.text, true); }
    };

    // Inline math: $ ... $  (not $$, no unescaped newline)
    var inlineMath = {
        name: "inlineMath",
        level: "inline",
        start: function (src) { var i = src.indexOf("$"); return i < 0 ? undefined : i; },
        tokenizer: function (src) {
            var m = /^\$(?!\$)((?:\\.|[^$\\\n])+?)\$/.exec(src);
            if (m) return { type: "inlineMath", raw: m[0], text: m[1] };
        },
        renderer: function (t) { return tex(t.text, false); }
    };

    // Footnote definition: [^id]: text   (a block, renders nothing inline)
    var footnoteDef = {
        name: "footnoteDef",
        level: "block",
        start: function (src) { var m = src.match(/^\[\^[^\]\s]+\]:/m); return m ? m.index : undefined; },
        tokenizer: function (src) {
            var m = /^\[\^([^\]\s]+)\]:[ \t]*([^\n]*(?:\n(?! *\n)(?!\[\^).*)*)/.exec(src);
            if (m) {
                var id = m[1];
                fnDefs[id] = m[2].replace(/\n[ \t]*/g, " ").trim();
                return { type: "footnoteDef", raw: m[0] };
            }
        },
        renderer: function () { return ""; }
    };

    // Footnote reference: [^id]  -> superscript number linking down
    var footnoteRef = {
        name: "footnoteRef",
        level: "inline",
        start: function (src) { var i = src.indexOf("[^"); return i < 0 ? undefined : i; },
        tokenizer: function (src) {
            var m = /^\[\^([^\]\s]+)\]/.exec(src);
            if (m) return { type: "footnoteRef", raw: m[0], id: m[1] };
        },
        renderer: function (t) {
            var id = t.id;
            if (!(id in fnNumbers)) { fnNumbers[id] = ++fnCounter; fnOrder.push(id); }
            var n = fnNumbers[id], e = encodeURIComponent(id);
            return '<sup class="fn-ref"><a id="fnref-' + e + '" href="#fn-' + e + '">' + n + "</a></sup>";
        }
    };

    function tex(src, display) {
        try {
            return katex.renderToString(src, { displayMode: display, throwOnError: false });
        } catch (e) {
            return '<code class="tex-error">' + escapeHtml(src) + "</code>";
        }
    }

    marked.use({
        extensions: [displayMath, inlineMath, footnoteRef, footnoteDef]
    });

    // ---- fetch + render ---------------------------------------------------
    Promise.all([
        fetch("/notes/" + slug + ".md").then(function (r) {
            if (!r.ok) throw new Error("missing");
            return r.text();
        }),
        fetch("/notes/notes.json").then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
    ]).then(function (res) {
        var md = res[0];
        var meta = (res[1] || []).filter(function (x) { return x.slug === slug; })[0] || {};

        var title = meta.title || slug;
        document.getElementById("note-title").textContent = title;
        document.title = title + " – Ben Pomeranz";
        if (meta.date) document.getElementById("note-date").textContent = fmtDate(meta.date);

        // reset footnote state, then render
        fnDefs = {}; fnNumbers = {}; fnOrder = []; fnCounter = 0;

        var html = marked.parse(md);
        html += renderFootnotes();

        var body = document.getElementById("note-body");
        body.innerHTML = html;
        fitIframes(body);

        // smooth in-page jumps for footnote links
        body.addEventListener("click", function (e) {
            var a = e.target.closest && e.target.closest('a[href^="#"]');
            if (!a) return;
            var el = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
            if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "center" }); history.replaceState(null, "", a.getAttribute("href")); }
        });
    }).catch(function () {
        showError("That note doesn’t exist (yet).");
    });

    function renderFootnotes() {
        if (!fnOrder.length) return "";
        var items = fnOrder.map(function (id) {
            var e = encodeURIComponent(id);
            var def = fnDefs[id] !== undefined ? marked.parseInline(fnDefs[id]) : "<em>(missing footnote)</em>";
            return '<li id="fn-' + e + '">' + def +
                ' <a class="fn-back" href="#fnref-' + e + '" aria-label="Back to reference">←</a></li>';
        }).join("\n");
        return '<hr class="fn-sep"><ol class="footnotes">\n' + items + "\n</ol>";
    }

    // Size same-origin iframes to fit their content so there's no inner
    // scrollbar. Embeds that center themselves in a full-viewport body (like
    // the animation) are told to shrink-wrap their content first. Cross-origin
    // iframes throw on access and keep whatever height the author set.
    function fitIframes(container) {
        var frames = container.querySelectorAll("iframe");
        Array.prototype.forEach.call(frames, function (f) {
            function fit() {
                try {
                    var doc = f.contentDocument;
                    if (!doc || !doc.body) return;
                    if (doc.head && !doc.getElementById("__fit_style")) {
                        var st = doc.createElement("style");
                        st.id = "__fit_style";
                        st.textContent = "html,body{min-height:0!important;height:auto!important}";
                        doc.head.appendChild(st);
                    }
                    var h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
                    if (h > 0) f.style.height = h + "px";
                } catch (e) { /* cross-origin: leave the authored height */ }
            }
            function startFitting() {
                fit();
                // Heavy embeds (e.g. a bundled animation) finish rendering well
                // after load, so poll briefly until the height settles.
                var ticks = 0;
                var iv = setInterval(function () {
                    fit();
                    if (++ticks >= 24) clearInterval(iv);   // ~6s of coverage
                }, 250);
                // Keep tracking ongoing/interactive size changes after that.
                try {
                    var ro = new ResizeObserver(fit);
                    ro.observe(f.contentDocument.documentElement);
                } catch (e) { /* cross-origin or unsupported */ }
            }
            f.addEventListener("load", startFitting);
            // handle the cached/already-loaded case
            try {
                if (f.contentDocument && f.contentDocument.readyState === "complete") startFitting();
            } catch (e) { /* cross-origin */ }
        });
    }

    // ---- helpers ----------------------------------------------------------
    function fmtDate(iso) {
        var p = iso.split("-").map(Number);
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[p[1] - 1] + " " + p[2] + ", " + p[0];
    }
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function showError(msg) {
        document.getElementById("note-title").textContent = "Not found";
        document.getElementById("note-body").innerHTML = '<p class="muted">' + msg + ' <a href="/notes/">Back to all notes.</a></p>';
    }
})();
