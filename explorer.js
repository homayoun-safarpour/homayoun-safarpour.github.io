// Framework explorer: eight controls as pillars; a run travels through them. Buttons and keyboard always work;
// the 3D view loads only with WebGL, no reduced motion and a wide screen. three.js r165, vendored.
const DATA = [{"n": 1, "name": "Scope and permissions", "q": "May the agent do this, with these arguments, after what it has already done?", "ours": "Gate 2: every call replayed through Microsoft's policy engine, default deny.", "status": "partial", "note": "Tool names only; not arguments or call order yet.", "related": "OWASP Agentic Top 10: ASI02 tool misuse. EU AI Act Art. 9. NIST AI RMF MANAGE.", "gate": "Gate 2", "count": 9}, {"n": 2, "name": "Behaviour evidence", "q": "What did the agent actually do, step by step, not only at the end?", "ours": "Gate 1: the trace against a reviewed rubric and a pinned baseline; a forbidden call stops the run.", "status": "covered", "note": "Covered for tools and their order.", "related": "EU AI Act Art. 15. NIST AI RMF MEASURE 2.5.", "gate": "Gate 1", "count": 8}, {"n": 3, "name": "Records and traceability", "q": "Can someone else find the record of the run and check it?", "ours": "Gate 3 and the sha256 fingerprint of every file each gate read.", "status": "covered", "note": "Covered.", "related": "EU AI Act Art. 12 record-keeping.", "gate": "Gate 3", "count": 8}, {"n": 4, "name": "Human oversight and hand-over", "q": "Did a person get a usable record, and could they really step in?", "ours": "Gate 4: the hand-over record must name what was proved, what is pending, when to stop.", "status": "partial", "note": "Checks the record, not whether it is true or whether anyone intervened.", "related": "EU AI Act Art. 14 human oversight.", "gate": "Gate 4", "count": 9}, {"n": 5, "name": "Evaluation validity and judges", "q": "Is the score itself trustworthy: checked against people, repeated, free of order and wording bias?", "ours": "Gate 5: agreement between judges and each judge's consistency.", "status": "partial", "note": "No human-labelled anchor or bias probes yet. The research is loudest here.", "related": "NIST AI RMF MEASURE 2.13.", "gate": "Gate 5", "count": 28}, {"n": 6, "name": "Adversarial testing", "q": "Does a determined attack succeed, including instructions hidden in what the agent reads?", "ours": "Gate 6: a red-team report read and counted.", "status": "partial", "note": "Model scans only; not attacks through the agent's tools.", "related": "OWASP Agentic Top 10: ASI01 goal hijack. EU AI Act Art. 15. NIST AI RMF MEASURE 2.7.", "gate": "Gate 6", "count": 7}, {"n": 7, "name": "Monitoring after deployment", "q": "Does the agent behave in real use the way it did in tests?", "ours": "None yet.", "status": "gap", "note": "The clearest gap: models can tell when they are being tested.", "related": "EU AI Act Art. 72 post-market monitoring. NIST AI RMF MANAGE 4.", "gate": "None yet", "count": 4}, {"n": 8, "name": "Accountability and governance", "q": "Who answers for the result, and against which rule?", "ours": "The report itself: each tool, version, verdict and exit code; the EU requirements map.", "status": "partial", "note": "Evidence for a decision, not the decision.", "related": "EU AI Act Art. 17 quality management. ISO/IEC 42001. NIST AI RMF GOVERN.", "gate": "The report", "count": 10}];
const panel = document.getElementById("x-panel");
const buttons = [...document.querySelectorAll(".xb")];
let selected = 0, userTook = false, onSelect = () => {};
const show = (i) => {
  selected = i;
  const d = DATA[i];
  panel.querySelector(".x-n").textContent = d.n;
  panel.querySelector(".x-name").textContent = d.name;
  const s = panel.querySelector(".x-status");
  s.textContent = d.status; s.className = "x-status x-" + d.status;
  panel.querySelector(".x-q").textContent = d.q;
  panel.querySelector(".x-ours").textContent = d.ours + " " + d.note;
  panel.querySelector(".x-count").textContent = d.count + " verified findings";
  panel.querySelector(".x-related").textContent = d.related;
  buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  onSelect(i);
};
buttons.forEach((b, i) => b.addEventListener("click", () => { userTook = true; show(i); }));

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage = document.getElementById("x-stage");
const webgl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();
if (stage && webgl && !reduce && window.innerWidth > 640) {
  import("./vendor/three.module.min.js").then((THREE) => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.append(renderer.domElement);
    stage.classList.add("on");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 4.2, 9.5);
    camera.lookAt(0, 0.9, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(3, 6, 5); scene.add(sun);
    const world = new THREE.Group(); scene.add(world);
    const COLORS = { covered: 0x3fae7a, partial: 0xd4a73c, gap: 0x8a948d };
    const R = 3.4, pillars = [];
    const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.06, R + 0.06, 96), new THREE.MeshBasicMaterial({ color: 0x5f7a6c, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
    ring.rotation.x = -Math.PI / 2; world.add(ring);
    DATA.forEach((d, i) => {
      const a = (i / DATA.length) * Math.PI * 2;
      const h = 0.5 + d.count * 0.09;
      const geo = new THREE.BoxGeometry(0.62, h, 0.62);
      const mat = d.status === "gap"
        ? new THREE.MeshStandardMaterial({ color: COLORS.gap, transparent: true, opacity: 0.18 })
        : new THREE.MeshStandardMaterial({ color: COLORS[d.status], roughness: 0.5, metalness: 0.05 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(Math.sin(a) * R, h / 2, Math.cos(a) * R);
      m.userData = { i, h, base: mat.color.clone() };
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: d.status === "gap" ? 0xd9e2dc : 0x0f2a20 }));
      m.add(edges);
      world.add(m); pillars.push(m);
    });
    const run = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3fae7a, emissiveIntensity: 0.6 }));
    world.add(run);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
    halo.rotation.x = -Math.PI / 2; world.add(halo);
    let target = 0;
    onSelect = (i) => {
      const p = pillars[i];
      halo.position.set(p.position.x, 0.02, p.position.z);
      pillars.forEach((q, k) => q.scale.setScalar(k === i ? 1.14 : 1));
      if (userTook) { const a = (i / DATA.length) * Math.PI * 2; target = -a + Math.round((target + a) / (Math.PI * 2)) * Math.PI * 2; }
    };
    onSelect(selected);
    const size = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    };
    size(); window.addEventListener("resize", size);
    let drag = null, spin = 0, lastY = window.scrollY;
    window.addEventListener("scroll", () => { const y = window.scrollY; if (!userTook) target += (y - lastY) * 0.003; lastY = y; }, { passive: true });
    stage.addEventListener("pointerdown", (ev) => { drag = { x: ev.clientX, s: target }; stage.setPointerCapture(ev.pointerId); });
    stage.addEventListener("pointermove", (ev) => { if (drag) { target = drag.s + (ev.clientX - drag.x) * 0.008; userTook = true; } });
    stage.addEventListener("pointerup", (ev) => {
      if (drag && Math.abs(ev.clientX - drag.x) < 4) {
        const r = stage.getBoundingClientRect();
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camera);
        const hit = ray.intersectObjects(pillars, false)[0];
        if (hit) { userTook = true; show(hit.object.userData.i); }
      }
      drag = null;
    });
    let visible = true, last = 0, frame = 0, t0 = performance.now(), lastAuto = performance.now();
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) frame = requestAnimationFrame(tick); }).observe(stage);
    function tick(now) {
      if (!visible || document.hidden) return;
      frame = requestAnimationFrame(tick);
      if (now - last < 32) return;
      last = now;
      const t = (now - t0) / 1000;
      if (!drag && !userTook) target += 0.0025;
      pillars.forEach((q, k) => { const y = q.userData.h / 2 + (k === selected ? 0.32 : 0); q.position.y += (y - q.position.y) * 0.12; });
      spin += (target - spin) * 0.08;
      world.rotation.y = spin;
      const lap = (t % 12) / 12, a = lap * Math.PI * 2;
      run.position.set(Math.sin(a) * R, 0.25 + Math.abs(Math.sin(a * 4)) * 0.15, Math.cos(a) * R);
      const near = Math.round(lap * DATA.length) % DATA.length;
      const gapNow = DATA[near].status === "gap" && Math.abs(lap * DATA.length - Math.round(lap * DATA.length)) < 0.18;
      run.material.emissive.setHex(gapNow ? 0xd9781f : 0x3fae7a);
      if (!userTook && now - lastAuto > 4500) { lastAuto = now; show((selected + 1) % DATA.length); }
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(tick);
  }).catch(() => {});
}
