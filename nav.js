/* Shared nav loader: fetch nav.html, inject it, and mark the link for the
   current page (and section) as active. Replaces the per-page inline fetch. */
(function () {
    var ph = document.getElementById("nav-placeholder");
    if (!ph) return;

    function norm(p) {
        return p.replace(/index\.html$/, "").replace(/\/$/, "") || "/";
    }

    fetch("/nav.html?v=3")
        .then(function (r) { return r.text(); })
        .then(function (html) {
            ph.innerHTML = html;
            var here = norm(location.pathname);
            var links = ph.querySelectorAll("nav a");
            Array.prototype.forEach.call(links, function (a) {
                var href = a.getAttribute("href");
                if (!href || href.charAt(0) !== "/") return;   // skip external/icon links
                var target = norm(href);
                if (target === here || (target !== "/" && here.indexOf(target + "/") === 0)) {
                    a.classList.add("active");
                }
            });
        });
})();
