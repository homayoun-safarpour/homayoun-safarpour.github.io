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
  if (!reduce && "IntersectionObserver" in window) {
    let i = 0, timer = 0, touched = false;
    ["pointerenter", "focusin", "click"].forEach((ev) => wrap.addEventListener(ev, () => { touched = true; clearInterval(timer); }));
    new IntersectionObserver((en) => {
      clearInterval(timer);
      if (en[0].isIntersecting && !touched) timer = setInterval(() => { pick(i % rows.length); i += 1; }, 2200);
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
      ctx.fillStyle = "#4d5954"; ctx.font = "600 11px system-ui, sans-serif"; ctx.fillText(h.label.replace(/^Gate [\d ]+/, "").split(":")[0], c.x, c.y + (W < 640 ? 96 : 104));
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

// 3. A small 3D run in the corner of the audit: each gate takes the colour of its real verdict
(() => {
  const audit = document.querySelector(".audit");
  const marks = [...document.querySelectorAll("#audit-gates .gate")];
  const webgl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();
  if (!audit || marks.length !== 6 || reduce || !webgl || window.innerWidth <= 900) return;
  import("./vendor/three.module.min.js").then((THREE) => {
    const stage = document.createElement("div");
    stage.className = "audit-3d floaty";
    stage.setAttribute("aria-hidden", "true");
    audit.prepend(stage);
    audit.classList.add("has3d");
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(-2.2, 2.6, 9.6); camera.lookAt(0, 0.7, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(-3, 6, 6); scene.add(sun);
    const GAP = 1.5, x0 = -3.75;
    const COL = { none: new THREE.Color(0xb9c0b9), pass: new THREE.Color(0x174e3d), fail: new THREE.Color(0xc0651a), missing: new THREE.Color(0x17211e), error: new THREE.Color(0x17211e) };
    const road = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.04, 1.5), new THREE.MeshStandardMaterial({ color: 0xe6eae2 }));
    road.position.y = -0.02; scene.add(road);
    const gates = marks.map((m, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: COL.none.clone(), roughness: 0.55 });
      const g = new THREE.Group(), post = new THREE.BoxGeometry(0.13, 1.5, 0.13);
      const l = new THREE.Mesh(post, mat); l.position.set(0, 0.75, -0.55);
      const r = new THREE.Mesh(post, mat); r.position.set(0, 0.75, 0.55);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 1.23), mat); top.position.set(0, 1.5, 0);
      g.add(l, r, top); g.position.x = x0 + i * GAP; scene.add(g);
      return { g, mat, want: COL.none, shake: 0 };
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 24), new THREE.MeshStandardMaterial({ color: 0x17211e }));
    ball.position.set(x0 - 1, 0.2, 0); scene.add(ball);
    const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); };
    size(); window.addEventListener("resize", size);
    let reached = -1, visible = true, frame = 0, last = 0, quiet = 0;
    const read = () => {
      reached = -1;
      marks.forEach((m, i) => {
        const c = m.getAttribute("class") || "";
        const kind = ["pass", "fail", "missing", "error"].find((k) => c.includes(k)) || "none";
        if (kind !== "none") reached = i;
        if (gates[i].want !== COL[kind] && kind !== "none" && kind !== "pass") gates[i].shake = 1;
        gates[i].want = COL[kind];
      });
      quiet = performance.now();
      if (!frame && visible) frame = requestAnimationFrame(tick);
    };
    const watch = new MutationObserver(read);
    marks.forEach((m) => watch.observe(m, { attributes: true, attributeFilter: ["class"] }));
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) read(); }).observe(stage);
    function tick(now) {
      frame = 0;
      if (!visible || document.hidden) return;
      if (now - last >= 32) {
        last = now;
        const tx = reached < 0 ? x0 - 1 : x0 + reached * GAP + (reached === 5 ? 0.9 : 0);
        ball.position.x += (tx - ball.position.x) * (tx < ball.position.x ? 0.5 : 0.12);
        ball.position.y = 0.2 + Math.abs(Math.sin(ball.position.x * 2.1)) * 0.1;
        gates.forEach((gt) => {
          gt.mat.color.lerp(gt.want, 0.14);
          gt.shake *= 0.9;
          gt.g.rotation.z = Math.sin(now / 40) * 0.12 * gt.shake;
        });
        renderer.render(scene, camera);
      }
      if (now - quiet < 3000) frame = requestAnimationFrame(tick);
    }
    read();
  }).catch(() => {});
})();
