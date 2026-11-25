// Floating stages: an interactive flowchart for the EU requirements, a knowledge map of the sources, and a small 3D run
// in the corner of the audit. Each one is built from what is already on the page, so the page reads the same without it.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";
const el = (name, attrs = {}, text) => {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
};

// 1. EU requirements as a flowchart, drawn from the table's own rows
(() => {
  const box = document.querySelector(".eu-map");
  const table = box && box.querySelector("table");
  if (!table) return;
  const GATES = ["Behaviour", "Policy", "Completion", "Hand-over", "Judges", "Red team"];
  const rows = [...table.querySelectorAll("tbody tr")].map((tr) => ({
    name: tr.querySelector("th").textContent.trim(),
    note: tr.querySelector("td").textContent.trim(),
    gates: [...new Set((tr.querySelector("td").textContent.match(/(^|; )([1-6]) /g) || []).map((m) => Number(m.replace(/\D/g, "")) - 1))],
  }));
  const H = 40 + rows.length * 46;
  const svg = el("svg", { viewBox: "0 0 780 " + H, class: "eu-flow", role: "group", "aria-label": "Flowchart: which gate gives evidence for each requirement" });
  svg.innerHTML = '<defs><filter id="hand"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter></defs>';
  const lines = el("g", { filter: "url(#hand)" });
  svg.append(lines);
  const gy = (j) => 34 + j * ((H - 60) / 5);
  const gateNodes = GATES.map((name, j) => {
    const g = el("g", { class: "ef-gate" });
    g.append(el("circle", { cx: 610, cy: gy(j), r: 17 }), el("text", { x: 610, y: gy(j) + 5, "text-anchor": "middle", class: "ef-num" }, String(j + 1)),
      el("text", { x: 636, y: gy(j) + 5, class: "ef-name" }, name));
    svg.append(g);
    return g;
  });
  const note = document.createElement("p");
  note.className = "ef-note";
  note.textContent = "Touch or hover a requirement to see its gates.";
  const pick = (i) => {
    items.forEach((it, k) => it.g.classList.toggle("on", k === i));
    gateNodes.forEach((g, j) => g.classList.toggle("on", i >= 0 && rows[i].gates.includes(j)));
    svg.classList.toggle("picked", i >= 0);
    note.textContent = i < 0 ? "Touch or hover a requirement to see its gates." : rows[i].name + ": " + rows[i].note;
  };
  const items = rows.map((row, i) => {
    const y = 30 + i * 46;
    const g = el("g", { class: "ef-req" + (row.gates.length ? "" : " gap"), tabindex: "0", role: "button", "aria-label": row.name + ". " + row.note });
    g.append(el("text", { x: 8, y: y + 5 }, row.name));
    const paths = el("g", { class: "ef-paths" });
    if (row.gates.length) {
      row.gates.forEach((j) => paths.append(el("path", { d: `M318 ${y} C 430 ${y}, 480 ${gy(j)}, 590 ${gy(j)}`, pathLength: "1" })));
    } else {
      paths.append(el("path", { d: `M318 ${y} C 360 ${y}, 380 ${y + 6}, 420 ${y + 2}`, pathLength: "1" }), el("circle", { cx: 430, cy: y + 2, r: 7, class: "ef-open" }));
    }
    lines.append(paths);
    g.paths = paths;
    paths.classList.toggle("gap", !row.gates.length);
    ["pointerenter", "focus", "click"].forEach((ev) => g.addEventListener(ev, () => { paths.classList.add("on"); pick(i); }));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(i); } });
    svg.append(g);
    return { g, paths };
  });
  const sync = new MutationObserver(() => items.forEach((it) => it.paths.classList.toggle("on", it.g.classList.contains("on"))));
  items.forEach((it) => sync.observe(it.g, { attributes: true, attributeFilter: ["class"] }));
  svg.addEventListener("pointerleave", () => pick(-1));
  const wrap = document.createElement("div");
  wrap.className = "eu-flow-wrap floaty";
  wrap.append(svg, note);
  table.before(wrap);
  table.classList.add("sr-only");
  // One pass through the requirements when the chart first comes into view, then it waits for the visitor.
  if (!reduce && "IntersectionObserver" in window) {
    let i = 0, timer = 0, touched = false;
    const stopTour = () => { clearInterval(timer); timer = 0; };
    ["pointerenter", "focusin", "click"].forEach((ev) => wrap.addEventListener(ev, () => { touched = true; stopTour(); }));
    new IntersectionObserver((en) => {
      stopTour();
      if (en[0].isIntersecting && !touched && i < rows.length) {
        timer = setInterval(() => {
          if (i >= rows.length) { stopTour(); pick(-1); return; }
          pick(i); i += 1;
        }, 2200);
      }
    }, { threshold: 0.5 }).observe(wrap);
  }
})();

// 2. Knowledge map: every source in the library as a dot orbiting its group
(() => {
  const lib = document.querySelector(".library");
  const groups = lib ? [...lib.querySelectorAll(".lib-group")] : [];
  if (!groups.length || reduce || !("IntersectionObserver" in window)) return;
  const wrap = document.createElement("div");
  wrap.className = "kmap floaty";
  const canvas = document.createElement("canvas");
  const tip = document.createElement("p");
  tip.className = "kmap-tip";
  tip.textContent = "Each dot is one source. Hover for its title, click to open it.";
  wrap.append(canvas, tip);
  groups[0].before(wrap);
  const ctx = canvas.getContext("2d");
  const hubs = groups.map((g, k) => ({
    label: g.querySelector("summary").textContent.replace(/\s+/g, " ").trim().replace(/ \d+$/, ""),
    dots: [...g.querySelectorAll("li a")].map((a, i) => ({ title: a.textContent, href: a.href, ring: i % 3, phase: i * 2.399 })),
    k,
  }));
  let W = 0, Hh = 0, t = 0, hover = null, visible = false, frame = 0, last = 0;
  const size = () => {
    const r = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth; Hh = W < 640 ? 420 : 300;
    canvas.width = W * r; canvas.height = Hh * r; canvas.style.height = Hh + "px";
    ctx.setTransform(r, 0, 0, r, 0, 0);
  };
  const place = (h) => W < 640 ? { x: W * (0.28 + 0.44 * (h.k % 2)), y: Hh * (0.27 + 0.48 * Math.floor(h.k / 2)) } : { x: W * (0.13 + 0.245 * h.k), y: Hh * 0.5 };
  const pos = (h, d) => {
    const c = place(h), rad = 34 + d.ring * 17, a = d.phase + t * (0.16 - d.ring * 0.04);
    return { x: c.x + Math.cos(a) * rad, y: c.y + Math.sin(a) * rad * 0.82 };
  };
  const draw = (now) => {
    frame = 0;
    if (!visible || document.hidden) return;
    frame = requestAnimationFrame(draw);
    if (now - last < 40) return;
    last = now;
    if (!hover) t += 0.02;
    ctx.clearRect(0, 0, W, Hh);
    const centres = hubs.map(place);
    ctx.strokeStyle = "#174e3d33"; ctx.lineWidth = 1.5; ctx.beginPath();
    centres.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y))); ctx.stroke();
    const lap = (now / 1500) % (centres.length - 1), seg = Math.floor(lap), f = lap - seg;
    const a = centres[seg], b = centres[seg + 1];
    ctx.fillStyle = "#d9781f"; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, 4, 0, 7); ctx.fill();
    hubs.forEach((h) => {
      const c = place(h);
      ctx.fillStyle = "#174e3d"; ctx.beginPath(); ctx.arc(c.x, c.y, 15, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "700 11px Consolas, monospace"; ctx.textAlign = "center"; ctx.fillText(String(h.dots.length), c.x, c.y + 4);
      ctx.fillStyle = "#4d5954"; ctx.font = "600 11px system-ui, sans-serif"; ctx.fillText(h.label.replace(/^Gates? \d+(?: and \d+)? /, "").split(":")[0], c.x, c.y + (W < 640 ? 96 : 104));
      h.dots.forEach((d) => {
        const p = pos(h, d), on = hover === d;
        ctx.fillStyle = on ? "#d9781f" : "#174e3d99"; ctx.beginPath(); ctx.arc(p.x, p.y, on ? 6 : 3.4, 0, 7); ctx.fill();
      });
    });
  };
  const find = (ev) => {
    const r = canvas.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
    let best = null, bd = 144;
    hubs.forEach((h) => h.dots.forEach((d) => { const p = pos(h, d), q = (p.x - x) ** 2 + (p.y - y) ** 2; if (q < bd) { bd = q; best = d; } }));
    return best;
  };
  canvas.addEventListener("pointermove", (ev) => {
    hover = find(ev);
    canvas.style.cursor = hover ? "pointer" : "default";
    tip.textContent = hover ? hover.title : "Each dot is one source. Hover for its title, click to open it.";
  });
  canvas.addEventListener("pointerleave", () => { hover = null; tip.textContent = "Each dot is one source. Hover for its title, click to open it."; });
  canvas.addEventListener("click", (ev) => { const d = find(ev); if (d) window.open(d.href, "_blank", "noopener"); });
  size(); window.addEventListener("resize", size);
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible && !frame) frame = requestAnimationFrame(draw); }).observe(wrap);
})();
