/* Crosskeys Resin site.js. Everything here enhances a page that already works without it. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raf = window.requestAnimationFrame.bind(window);

  /* The bar tucks away going down and returns going up. On a phone it waits until about 7% of the page has gone by; on a larger screen, until the hero is behind you. It never hides while the menu is open or while keyboard focus is inside it. */
  var hdr = $(".hdr"), lastY = window.pageYOffset, drawerEl = $(".drawer");
  function keyboardInside() {
    var a = document.activeElement;
    if (!a || !hdr.contains(a)) return false;
    try { return a.matches(":focus-visible"); } catch (err) { return true; }
  }
  function barTrack() {
    if (!hdr) return;
    var y = window.pageYOffset, doc = document.documentElement;
    var phone = window.innerWidth < 760;
    var line = phone ? (doc.scrollHeight - window.innerHeight) * 0.07 : Math.min(420, window.innerHeight * 0.45);
    hdr.classList.toggle("stuck", y > 4);
    var holding = (drawerEl && drawerEl.classList.contains("open")) || keyboardInside();
    if (y < lastY - 2 || y <= line || holding) hdr.classList.remove("away");
    else if (y > lastY + 2) hdr.classList.add("away");
    /* Pinned things move up into the space the bar gives back. */
    document.documentElement.classList.toggle("bar-away", hdr.classList.contains("away"));
    lastY = y;
  }

  function onScroll() {
    barTrack();
    drawing();
    heroDrift();
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    raf(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  var burger = $(".burger"), drawer = $(".drawer");
  function setMenu(open) {
    if (!burger || !drawer) return;
    drawer.classList.toggle("open", open);
    if (open) {
      $$("a", drawer).forEach(function (a, i) { a.style.setProperty("--i", i); });
      requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add("in"); }); });
    } else {
      drawer.classList.remove("in");
    }
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { var first = $("a", drawer); if (first) first.focus(); }
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () { setMenu(!drawer.classList.contains("open")); });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) { setMenu(false); burger.focus(); }
    });
  }

  /* The dock rises once the page's own quote button has gone. While that button is on screen the dock stays down, so the same action is never in view twice. */
  var dock = $(".dock"), pageQuote = $("main .btn-wa");
  if (dock) {
    var watched = $$("main [data-dock-watch]");
    if (pageQuote && watched.indexOf(pageQuote) === -1) watched.unshift(pageQuote);
    if (watched.length && "IntersectionObserver" in window) {
      var inView = watched.map(function () { return false; });
      var dockIO = new IntersectionObserver(function (es) {
        es.forEach(function (en) { inView[watched.indexOf(en.target)] = en.isIntersecting; });
        dock.classList.toggle("up", inView.indexOf(true) === -1);
      }, { threshold: 0 });
      watched.forEach(function (w) { dockIO.observe(w); });
    } else {
      dock.classList.add("up");
    }
  }

  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
    $$(".rv").forEach(function (el) { io.observe(el); });
  } else {
    $$(".rv").forEach(function (el) { el.classList.add("in"); });
  }

  /* The drift follows the photograph's own position on screen and never exceeds the overscan the scale gives it, so the top edge can never be pulled into view. */
  var heroFig = $(".hero-fig"), heroImg = $(".hero-fig img");
  function heroDrift() {
    if (!heroImg || !heroFig || reduce) return;
    var r = heroFig.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    var max = r.height * 0.03;
    var shift = Math.max(-max, Math.min(max, -(r.top + r.height / 2 - vh / 2) * 0.12));
    var scale = 1 + (2 * max) / r.height + 0.01;
    heroImg.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0) scale(" + scale.toFixed(3) + ")";
  }

  /* The arrival. While the stage is pinned, scrolling grows the band to the full screen (the CSS turns --k into the clip, the push on the headline and the centring) and opens the letters cut in the limestone until the drive fills the screen. Read from position each frame, and it settles to its end state however fast the reader gets past; under reduced motion it stays still. */
  var hx = $(".hx");
  /* The name is laid out from the device's own font: measured with a canvas, sized to the width (stacked on a portrait screen), and centred with equal space between the bar and the Scroll cue. */
  if (hx) {
    var hxT = [$(".hx-t1", hx), $(".hx-t2", hx)], hxBox = $(".hx-in", hx), hxProbe = $(".hx-probe", hx), hxBarH = $(".hx-bar", hx), hxCueEl = $(".hx-cue", hx), hxCutEl = $(".hx-cut", hx);
    var HX_FONT = "Anton, Impact, 'Arial Narrow', sans-serif", hxMeasure = document.createElement("canvas").getContext("2d");
    var hxLayout = function () {
      var W = hxBox.clientWidth, B = hxProbe.offsetHeight, top = hxBarH.offsetHeight;
      if (!W || !B || !hxMeasure) return;
      var cueTop = B - 18 - hxCueEl.offsetHeight, room = cueTop - top, minGap = 26;
      var portrait = window.innerHeight > window.innerWidth;
      var lines = portrait ? ["CROSSKEYS", "RESIN"] : ["CROSSKEYS RESIN"];
      hxMeasure.font = "100px " + HX_FONT;
      var m = lines.map(function (t) { var r = hxMeasure.measureText(t); return { w: r.width, a: r.actualBoundingBoxAscent || 73 }; });
      var target = W * (portrait ? 0.9 : 0.86);
      var size = m.map(function (x) { return 100 * target / x.w; });
      var cap = m.map(function (x, i) { return x.a * size[i] / 100; });
      var gap = lines.length > 1 ? cap[0] * 0.2 : 0;
      var block = cap.reduce(function (s, c) { return s + c; }, 0) + gap;
      var fit = Math.min(1, (room - 2 * minGap) / block);
      var y = top + (room - block * fit) / 2;
      hxT.forEach(function (t, i) {
        if (i >= lines.length) { t.textContent = ""; return; }
        y += (i ? gap * fit : 0) + cap[i] * fit;
        t.textContent = lines[i];
        t.removeAttribute("dominant-baseline");
        t.setAttribute("x", (W / 2).toFixed(1));
        t.setAttribute("y", y.toFixed(1));
        t.setAttribute("font-size", (size[i] * fit).toFixed(2));
        t.setAttribute("textLength", (m[i].w * size[i] * fit / 100).toFixed(1));
        t.setAttribute("lengthAdjust", "spacingAndGlyphs");
      });
      var z = top + room / 2;
      hx.style.setProperty("--hx-z", z.toFixed(1) + "px");
      hxCutEl.style.transformOrigin = "50% " + z.toFixed(1) + "px";
    };
    hxLayout();
    if (document.fonts && document.fonts.load) document.fonts.load("100px Anton").then(hxLayout, function () {});
    window.addEventListener("resize", hxLayout, { passive: true });
  }
  if (hx && !reduce) {
    var hxCut = $(".hx-cut", hx), hxPhoto = $(".hx-photo img", hx), hxDim = $(".hx-dim", hx), hxCue = $(".hx-cue", hx), hxRun = $(".hx-run", hx), hxTick = false, hxLast = -1;
    var band = function (a, b, p) { var t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t); };
    var hxFrame = function () {
      hxTick = false;
      var run = hxRun ? hxRun.offsetHeight : 0;
      if (run <= 0) return;
      var p = Math.min(1, Math.max(0, -hx.getBoundingClientRect().top / run));
      if (p === hxLast) return;
      hxLast = p;
      hx.style.setProperty("--k", band(0, 0.55, p).toFixed(4));
      hxCut.style.transform = "scale(" + Math.exp(Math.log(24) * Math.pow(p, 1.5)).toFixed(4) + ")";
      hxCut.style.opacity = (1 - band(0.62, 0.8, p)).toFixed(3);
      hxDim.style.opacity = (0.4 * (1 - band(0.55, 0.88, p))).toFixed(3);
      if (hxPhoto) hxPhoto.style.transform = "scale(" + (1.14 - 0.14 * band(0, 1, p)).toFixed(4) + ")";
      var cue = 1 - band(0, 0.06, p);
      hxCue.style.opacity = cue.toFixed(3);
      hxCue.style.visibility = cue < 0.02 ? "hidden" : "";
    };
    window.addEventListener("scroll", function () { if (!hxTick) { hxTick = true; raf(hxFrame); } }, { passive: true });
    window.addEventListener("resize", function () { hxLast = -1; hxFrame(); }, { passive: true });
    hxFrame();
  }

  /* The drawing pins below the bar and stays there: centred on the screen on a larger screen, just under the bar on a phone. A step lights its layer as it reaches the reading line: the centre of the screen, or on a phone the line just under the drawing. Read from position, so it can never disagree with where the reader is. Without scripting the drawing is complete. */
  var xs = $(".xs"), steps = $$(".xs-step"), xsFig = $(".xs-fig"), xsTop = 0;
  function pinDrawing() {
    if (!xsFig || !hdr) return;
    var phone = window.innerWidth < 1000, cs = getComputedStyle(hdr);
    var below = parseFloat(cs.top) + hdr.offsetHeight + (phone ? 6 : 24);
    xsTop = phone ? below : Math.max(below, Math.round((window.innerHeight - xsFig.offsetHeight) / 2));
    xsFig.style.top = xsTop + "px";
    xsFig.style.setProperty("--xs-top", xsTop + "px");
  }
  function drawing() {
    if (!xs || !steps.length) return;
    var phone = window.innerWidth < 1000, at = 0;
    var line = phone && xsFig ? xsTop + xsFig.offsetHeight + 28 : window.innerHeight * 0.5;
    steps.forEach(function (s, i) {
      var r = s.getBoundingClientRect(), h = $("h3", s);
      var mark = phone && h ? h.getBoundingClientRect().top : r.top + r.height / 2;
      if (mark <= line) at = i + 1;
    });
    if (reduce && at === 0) at = steps.length;
    xs.setAttribute("data-at", String(at));
    steps.forEach(function (s, i) { s.classList.toggle("on", i + 1 === at); });
    if (xsFig) {
      var fr = xsFig.getBoundingClientRect(), xr = xs.getBoundingClientRect();
      xsFig.classList.toggle("stuck", Math.abs(fr.top - xsTop) < 2 && xr.top < xsTop && xr.bottom > fr.bottom + 1);
    }
  }

  pinDrawing();
  window.addEventListener("resize", function () { pinDrawing(); drawing(); }, { passive: true });
  window.addEventListener("load", function () { pinDrawing(); drawing(); });

  /* A link straight to a question (faq.html#planning) opens that answer. */
  function openAnswer() {
    var id = decodeURIComponent(location.hash.slice(1)), el = id && document.getElementById(id);
    if (el && el.tagName === "DETAILS") el.open = true;
  }
  openAnswer();
  window.addEventListener("hashchange", openAnswer);

  var gal = $(".gal"), more = $(".gal-more"), prev = $(".gal-prev"), next = $(".gal-next");
  function galEdges() {
    if (!gal || !prev || !next) return;
    prev.disabled = gal.scrollLeft <= 1;
    next.disabled = gal.scrollLeft >= gal.scrollWidth - gal.clientWidth - 1;
  }
  function galStep(dir) {
    var tile = $("a", gal), w = tile ? tile.getBoundingClientRect().width + 10 : 290;
    var n = Math.max(1, Math.floor(gal.clientWidth / w) - 1);
    gal.scrollBy({ left: dir * n * w, behavior: reduce ? "auto" : "smooth" });
  }
  if (gal) {
    gal.addEventListener("scroll", galEdges, { passive: true });
    window.addEventListener("resize", galEdges, { passive: true });
    if (prev && next) {
      prev.addEventListener("click", function () { galStep(-1); });
      next.addEventListener("click", function () { galStep(1); });
    }
    galEdges();
  }
  if (gal && more) {
    more.addEventListener("click", function () {
      var all = gal.classList.toggle("all");
      more.setAttribute("aria-expanded", all ? "true" : "false");
      more.querySelector("span").textContent = all ? "Show fewer" : "Show all " + $$("a", gal).length + " photographs";
      if (!all) { gal.scrollLeft = 0; gal.scrollIntoView({ block: "start" }); }
      galEdges();
    });
  }

  /* The colours shortlist. Picks are kept in this browser, and every WhatsApp
     button that sends it carries the names in its message. */
  var blends = $(".blends");
  if (blends) {
    var KEY = "ckr-shortlist", picks = [], byName = {};
    var pickBtns = $$(".pick", blends), plList = $(".pl-items"), plEmpty = $(".pl-empty"), plClear = $(".pl-clear"), plLive = $(".pl-live"), plHead = $("#pl-h");
    var senders = $$(".pick-send, .dock-wa"), waBase = senders.length ? senders[0].getAttribute("href").split("?")[0] : "";
    var dockLabel = $(".dock-wa > span"), dockHTML = dockLabel ? dockLabel.innerHTML : "";
    pickBtns.forEach(function (b) { byName[b.getAttribute("data-name")] = b; });
    var hideBroken = function (im) {
      if (im.complete && !im.naturalWidth && im.getAttribute("src")) im.classList.add("gone");
      im.addEventListener("error", function () { im.classList.add("gone"); });
    };
    $$("img", blends).forEach(hideBroken);
    try { picks = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (err) { picks = []; }
    if (!Array.isArray(picks)) picks = [];
    picks = picks.filter(function (n, k) { return byName[n] && picks.indexOf(n) === k; });
    var listed = function (names) {
      return names.length < 2 ? names.join("") : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    };
    var many = function (n) { return n + (n === 1 ? " colour" : " colours"); };
    function render() {
      pickBtns.forEach(function (b) { b.setAttribute("aria-pressed", picks.indexOf(b.getAttribute("data-name")) > -1 ? "true" : "false"); });
      plList.innerHTML = "";
      picks.forEach(function (n) {
        var src = $("img", byName[n]), li = document.createElement("li"), im = document.createElement("img"), b = document.createElement("b"), x = document.createElement("button");
        hideBroken(im); im.alt = ""; im.width = 44; im.height = 44; im.src = src ? (src.currentSrc || src.src) : "";
        b.textContent = n;
        x.type = "button"; x.className = "pl-x"; x.setAttribute("aria-label", "Remove " + n); x.setAttribute("data-name", n);
        x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        li.appendChild(im); li.appendChild(b); li.appendChild(x); plList.appendChild(li);
      });
      plEmpty.hidden = picks.length > 0;
      plClear.hidden = picks.length === 0;
      var text = "Hello Crosskeys Resin, I would like a free quote for a resin driveway. The " + (picks.length === 1 ? "colour I like is " : "colours I like are ") + listed(picks) + ".";
      senders.forEach(function (a) { a.setAttribute("href", picks.length ? waBase + "?text=" + encodeURIComponent(text) : waBase); });
      if (dockLabel) dockLabel.innerHTML = picks.length ? "Send " + many(picks.length) : dockHTML;
      try { localStorage.setItem(KEY, JSON.stringify(picks)); } catch (err) {}
    }
    function toggle(n) {
      var k = picks.indexOf(n);
      if (k > -1) picks.splice(k, 1); else picks.push(n);
      render();
      plLive.textContent = n + (k > -1 ? " removed. " : " added. ") + many(picks.length) + " on your shortlist.";
    }
    blends.addEventListener("click", function (e) {
      var b = e.target.closest(".pick");
      if (b) toggle(b.getAttribute("data-name"));
    });
    plList.addEventListener("click", function (e) {
      var x = e.target.closest(".pl-x");
      if (!x) return;
      var items = $$(".pl-x", plList), at = items.indexOf(x);
      toggle(x.getAttribute("data-name"));
      var rest = $$(".pl-x", plList);
      if (rest.length) rest[Math.min(at, rest.length - 1)].focus(); else plHead.focus();
    });
    var blMore = $(".bl-more");
    if (blMore) blMore.addEventListener("click", function () {
      var all = blends.classList.toggle("all");
      blMore.setAttribute("aria-expanded", all ? "true" : "false");
      blMore.querySelector("span").textContent = all ? "Show fewer" : "Show all " + pickBtns.length + " colours";
      if (all) { var tenth = pickBtns[9]; if (tenth) tenth.focus({ preventScroll: true }); }
      else blends.scrollIntoView({ block: "start" });
    });
    plClear.addEventListener("click", function () {
      picks = []; render(); plLive.textContent = "Shortlist cleared."; plHead.focus();
    });
    render();
  }

  /* One viewer for every gallery on the page. It steps through the set a photograph was opened from; keys, buttons and a horizontal swipe move it, a swipe down closes it, and focus returns to the tile. */
  var lb = $(".lb");
  if (lb) {
    var lbImg = $("img", lb), lbN = $(".lb-n", lb), lbC = $(".lb-t", lb);
    var BLANK = lbImg.getAttribute("src");
    var set = [], i = 0, opener = null;
    /* A tile's photograph is its link, or, when the page carries the photographs inside it, the picture the tile already shows. */
    function srcOf(a) {
      var h = a.getAttribute("href");
      if (h && h.charAt(0) !== "#") return h;
      var im = $("img", a) || $("img", a.parentNode);
      return im ? (im.currentSrc || im.src) : BLANK;
    }
    function show(k) {
      i = (k + set.length) % set.length;
      var a = set[i], im = $("img", a), cap = a.getAttribute("data-alt") || (im ? im.alt : "");
      lbImg.src = srcOf(a);
      lbImg.alt = cap;
      lbN.textContent = (i + 1) + " of " + set.length;
      lbC.textContent = cap;
      [i + 1, i - 1].forEach(function (j) {
        var n = set[(j + set.length) % set.length];
        if (n) (new Image()).src = srcOf(n);
      });
    }
    function open(group, k, from) {
      set = group; opener = from; show(k);
      lb.hidden = false; document.body.style.overflow = "hidden";
      $(".lb-x", lb).focus();
    }
    function close() {
      lb.hidden = true; document.body.style.overflow = "";
      lbImg.src = BLANK;
      if (opener) opener.focus();
    }
    $$("[data-lb]").forEach(function (g) {
      var tiles = $$("a", g);
      tiles.forEach(function (a, k) {
        a.addEventListener("click", function (e) { e.preventDefault(); open(tiles, k, a); });
      });
    });
    $(".lb-x", lb).addEventListener("click", close);
    $(".lb-p", lb).addEventListener("click", function () { show(i - 1); });
    $(".lb-nx", lb).addEventListener("click", function () { show(i + 1); });
    var swiped = false;
    /* A swipe that ends over the backdrop must not also count as a tap on it. */
    lb.addEventListener("click", function (e) { if (swiped) { swiped = false; return; } if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      /* Focus stays inside the viewer while it is open. */
      if (e.key === "Tab") {
        var f = $$("button", lb).filter(function (b) { return b.offsetParent !== null; }), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (f.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
        return;
      }
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(i - 1);
      else if (e.key === "ArrowRight") show(i + 1);
    });
    var sx = 0, sy = 0, down = false;
    lb.addEventListener("pointerdown", function (e) { if (!e.isPrimary) return; down = true; swiped = false; sx = e.clientX; sy = e.clientY; });
    lb.addEventListener("pointerup", function (e) {
      if (!down) return; down = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      swiped = Math.abs(dx) > 10 || Math.abs(dy) > 10;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? i + 1 : i - 1);
      else if (dy > 90 && dy > Math.abs(dx)) close();
    });
  }

  /* The request tool. Every WhatsApp button opens it: the job chosen from pictures, then the space and colour for resin work, then where, when and who, while a card writes the request as it is built. It opens in WhatsApp ready to send. Without scripting the buttons stay plain links to WhatsApp. */
  var qm = $(".qm");
  if (qm) {
    var qForm = $(".qm-form", qm), qCard = $(".qm-card", qm), qWhere = $("#qm-where"), qName = $("#qm-name"), qNote = $("#qm-note");
    var qSteps = $$(".qm-step", qm), qBack = $(".qm-back", qm), qNext = $(".qm-next", qm), qSend = $(".qm-send", qm), qN = $(".qm-stepn", qm), qBars = $$(".qm-prog i", qm);
    var qFrom = null, qLock = "", qAt = 0;
    var STEP = { what: "The job", space: "The space", colour: "Colour", who: "Where, when and who" };
    var picked = function () {
      try { var a = JSON.parse(localStorage.getItem("ckr-shortlist") || "[]"); return Array.isArray(a) ? a : []; } catch (err) { return []; }
    };
    var joined = function (n) { return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1]; };
    var val = function (name) { var r = $('input[name="' + name + '"]:checked', qm); return r ? r.value : ""; };
    var resin = function () { var r = $('input[name="what"]:checked', qm); return !!r && r.getAttribute("data-kind") === "resin"; };
    var route = function () { return resin() || !val("what") ? ["what", "space", "colour", "who"] : ["what", "who"]; };
    function summary() {
      var names = picked(), drive = val("what") === "A resin driveway", r = resin(), c = val("colour");
      var colour = !r ? "" : c === "shortlist" && names.length ? joined(names) : c === "help" ? "Help choosing on the visit" : c === "later" ? "Not decided yet" : "";
      var d = { what: val("what"), size: r ? (drive ? val("size") : val("size2")) : "", now: r ? val("now") : "", colour: colour, where: qWhere.value.trim(), when: val("when"), name: qName.value.trim() };
      Object.keys(d).forEach(function (k) {
        var row = $('[data-k="' + k + '"]', qm), dd = $("dd", row);
        row.hidden = !r && (k === "size" || k === "now" || k === "colour");
        dd.textContent = d[k] || (k === "what" ? "Not chosen yet" : "Not set");
        dd.classList.toggle("set", !!d[k]);
      });
      return d;
    }
    function show(i) {
      var r = route();
      qAt = Math.max(0, Math.min(i, r.length - 1));
      qSteps.forEach(function (f) { f.hidden = f.getAttribute("data-step") !== r[qAt]; });
      qBars.forEach(function (bar, j) { bar.hidden = j >= r.length; bar.classList.toggle("on", j <= qAt); });
      qN.textContent = "Step " + (qAt + 1) + " of " + r.length + ": " + STEP[r[qAt]];
      var last = qAt === r.length - 1, drive = val("what") === "A resin driveway";
      qBack.hidden = qAt === 0; qNext.hidden = last; qSend.hidden = !last;
      $('[data-for="drive"]', qm).hidden = !drive; $('[data-for="area"]', qm).hidden = drive;
      qCard.scrollTop = 0;
      summary();
    }
    function focusStep() {
      var f = $(".qm-step:not([hidden]) input:checked, .qm-step:not([hidden]) input, .qm-step:not([hidden]) textarea", qm);
      if (f) f.focus({ preventScroll: true });
    }
    function forward() {
      if (qAt === 0 && !val("what")) { qN.textContent = "Choose the job first, then Next."; focusStep(); return; }
      show(qAt + 1); focusStep();
    }
    function qOpen(from) {
      /* From the phone menu the menu closes first, and focus will come back to its button. */
      var burger = $(".burger");
      if (from.closest(".drawer") && burger) { if (burger.getAttribute("aria-expanded") === "true") burger.click(); from = burger; }
      qFrom = from;
      var svc = qm.getAttribute("data-service"), town = qm.getAttribute("data-town");
      if (svc && !val("what")) $$('input[name="what"]', qm).forEach(function (r) { if (r.value === svc) r.checked = true; });
      if (town && !qWhere.value) qWhere.value = town;
      var names = picked(), sl = $("[data-shortlist]", qm);
      sl.hidden = names.length === 0;
      $("em", sl).textContent = joined(names);
      if (names.length && !val("colour")) $("input", sl).checked = true;
      qLock = document.body.style.overflow;
      qm.hidden = false; document.body.style.overflow = "hidden";
      raf(function () { qm.classList.add("in"); });
      show(0); focusStep();
    }
    function qClose() {
      qm.classList.remove("in"); qm.hidden = true; document.body.style.overflow = qLock;
      if (qFrom) qFrom.focus();
    }
    $$('a.btn[href^="https://wa.me/"]').forEach(function (a) { a.setAttribute("aria-haspopup", "dialog"); });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a.btn[href^="https://wa.me/"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); qOpen(a);
    });
    $(".qm-x", qm).addEventListener("click", qClose);
    qm.addEventListener("click", function (e) {
      if (e.target === qm) { qClose(); return; }
      /* A tap on a picture moves straight on; arrowing through them with the keyboard does not. */
      var t = e.target.closest && e.target.closest(".qm-tile");
      if (t && e.detail > 0 && qAt === 0) setTimeout(forward, 240);
    });
    qm.addEventListener("change", function (e) { if (e.target.name === "what") show(qAt); else summary(); });
    qm.addEventListener("input", summary);
    qNext.addEventListener("click", forward);
    qBack.addEventListener("click", function () { show(qAt - 1); focusStep(); });
    document.addEventListener("keydown", function (e) {
      if (qm.hidden) return;
      if (e.key === "Escape") { qClose(); return; }
      if (e.key !== "Tab") return;
      /* Focus stays inside the tool while it is open; each group of choices is one stop. */
      var f = $$("button, a[href], input, textarea", qm).filter(function (el) {
        if (el.offsetParent === null) return false;
        if (el.type !== "radio") return true;
        var group = $$('input[name="' + el.name + '"]', qm), on = group.filter(function (r) { return r.checked; })[0];
        return on ? el === on : el === group[0];
      }), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (f.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
    });
    qForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (qSend.hidden) { forward(); return; }
      var d = summary(), note = qNote.value.trim(), lines = ["Hello Crosskeys Resin, I would like a free quote."];
      if (d.what) lines.push("Job: " + d.what);
      if (d.size) lines.push("Size: " + d.size);
      if (d.now) lines.push("There now: " + d.now);
      if (d.colour) lines.push("Colour: " + d.colour);
      if (d.where) lines.push("Where: " + d.where);
      if (d.when) lines.push("When: " + d.when);
      if (note) lines.push(note);
      if (d.name) lines.push("My name is " + d.name + ".");
      var url = qm.getAttribute("data-wa") + "?text=" + encodeURIComponent(lines.join("\n"));
      var w = window.open(url, "_blank");
      if (w) w.opener = null; else window.location.href = url;
      qClose();
    });
  }

  /* Slideshows: one job at a time, chosen with the tabs. A step advances every few seconds only while the slideshow is on screen and the page is visible, never under reduced motion, and any touch, hover or key holds it for a while. */
  $$("[data-ss]").forEach(function (ss) {
    var tabs = $$(".ss-tab", ss), panels = $$(".ss-panel", ss), cur = panels[0], seen = false, quietUntil = 0;
    var parts = function (p) { return { slides: $$(".ss-slide", p), steps: $$(".ss-step", p), n: $(".ss-n", p) }; };
    function go(p, k) {
      var s = parts(p), len = s.slides.length;
      k = (k + len) % len; p.ssAt = k;
      s.slides.forEach(function (el, j) { el.classList.toggle("on", j === k); el.setAttribute("aria-hidden", j === k ? "false" : "true"); });
      s.steps.forEach(function (el, j) { el.setAttribute("aria-current", j === k ? "step" : "false"); });
      s.n.textContent = (k + 1) + " of " + len + ": " + $("span", s.steps[k]).textContent;
    }
    function hold() { quietUntil = Date.now() + 9000; }
    function pick(i, focus) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", j === i ? "true" : "false"); t.tabIndex = j === i ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = j !== i; });
      cur = panels[i]; go(cur, 0);
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { hold(); pick(i); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault(); hold(); pick((i + d + tabs.length) % tabs.length, true);
      });
    });
    panels.forEach(function (p) {
      go(p, 0);
      $(".ss-prev", p).addEventListener("click", function () { hold(); go(p, p.ssAt - 1); });
      $(".ss-next", p).addEventListener("click", function () { hold(); go(p, p.ssAt + 1); });
      parts(p).steps.forEach(function (b, j) { b.addEventListener("click", function () { hold(); go(p, j); }); });
      var stage = $(".ss-stage", p), x0 = null;
      stage.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
      stage.addEventListener("pointerup", function (e) {
        if (x0 === null) return;
        var dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) { hold(); go(p, p.ssAt + (dx < 0 ? 1 : -1)); }
      });
    });
    ss.addEventListener("pointerenter", hold);
    ss.addEventListener("focusin", hold);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.4 }).observe(ss);
    if (!reduce) setInterval(function () { if (seen && !document.hidden && Date.now() > quietUntil) go(cur, cur.ssAt + 1); }, 3600);
  });

  $$(".faq").forEach(function (f) {
    $$("details", f).forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (d.open) $$("details[open]", f).forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  onScroll();
})();
