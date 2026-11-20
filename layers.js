// Where each check sits: five rings (Data at the core, Infrastructure outside) and governance as a dashed ring that
// reaches into every layer. Tools are dots on their ring; choosing a ring or a list item shows its problem and tools.
// Drawn from the list in the page, so the page reads the same without this script.
const box = document.getElementById("layers");
if (box) {
  const NS = "http://www.w3.org/2000/svg";
  const el = (n, a = {}, t) => { const e = document.createElementNS(NS, n); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (t !== undefined) e.textContent = t; return e; };
  const items = [...box.querySelectorAll(".ly-item")];
  const layers = items.filter((li) => li.dataset.ring).map((li) => ({
    li, ring: Number(li.dataset.ring), name: li.querySelector("b").textContent,
    tools: [...li.querySelectorAll(".ly-tools a, .ly-tools span")].map((a) => a.textContent.trim()),
  }));
  const gov = items.find((li) => li.dataset.gov !== undefined);
  const C = 260, R0 = 44, STEP = 40;
  const svg = el("svg", { viewBox: "0 0 520 520", class: "ly-svg", role: "img", "aria-label": "Five layers as rings, Data at the centre, with governance reaching into every layer" });
  const gRings = el("g"), gGov = el("g", { class: "ly-gov" }), gDots = el("g");
  svg.append(gRings, gGov, gDots);
  const outer = R0 + STEP * 5 + 14;
  gGov.append(el("circle", { cx: C, cy: C, r: outer, class: "ly-gov-ring" }));
  layers.forEach((L, k) => {
    const r = R0 + STEP * (L.ring - 0.5);
    const ang = -Math.PI / 2 + k * 0.42;
    gGov.append(el("line", { x1: C + Math.cos(ang) * outer, y1: C + Math.sin(ang) * outer, x2: C + Math.cos(ang) * r, y2: C + Math.sin(ang) * r, class: "ly-gov-tick" }));
    gGov.append(el("circle", { cx: C + Math.cos(ang) * r, cy: C + Math.sin(ang) * r, r: 3.2, class: "ly-gov-end" }));
  });
  layers.slice().sort((a, b) => b.ring - a.ring).forEach((L) => {
    const rOut = R0 + STEP * L.ring, g = el("g", { class: "ly-ring", tabindex: "0", role: "button", "aria-label": L.name });
    g.append(el("circle", { cx: C, cy: C, r: rOut, class: "ly-band" }));
    L.g = g; gRings.append(g);
    const nr = R0 + STEP * (L.ring - 0.5);
    gDots.append(el("circle", { cx: C + nr, cy: C, r: 11, class: "ly-num-bg" }), el("text", { x: C + nr, y: C + 4.5, class: "ly-num" }, String(L.ring)));
    L.tools.forEach((t, i) => {
      const a = Math.PI * (0.62 + i * (0.5 / Math.max(1, L.tools.length - 1)) + L.ring * 0.13);
      const d = el("circle", { cx: C + Math.cos(a) * nr, cy: C + Math.sin(a) * nr, r: 6, class: "ly-dot" });
      d.append(el("title", {}, t));
      d.dataset.ring = L.ring; gDots.append(d);
    });
  });
  gDots.append(el("text", { x: C, y: C + 5, class: "ly-core" }, "Data"));
  box.querySelector(".ly-fig").prepend(svg);

  const pick = (L) => {
    items.forEach((li) => li.classList.toggle("on", L ? li === L.li : li === gov));
    layers.forEach((x) => x.g.classList.toggle("on", x === L));
    svg.classList.toggle("gov-on", !L);
    gDots.querySelectorAll(".ly-dot").forEach((d) => d.classList.toggle("on", !!L && Number(d.dataset.ring) === L.ring));
  };
  layers.forEach((L) => {
    const go = () => pick(L);
    L.g.addEventListener("click", go);
    L.g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    L.li.addEventListener("click", go);
  });
  if (gov) { gov.addEventListener("click", () => pick(null)); gGov.addEventListener("click", () => pick(null)); }
  pick(layers.find((L) => L.ring === 4) || layers[0]);
}
