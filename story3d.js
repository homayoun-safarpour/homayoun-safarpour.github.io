// 3D view for "Six gates, one at a time". It follows the classes the page already sets on the flat picture
// (.sg.on = passed, .sg.now = current), so the scroll logic stays in one place. Loads only with WebGL, no reduced
// motion and a wide screen; otherwise the flat picture stays. three.js r165, vendored.
const fig = document.querySelector(".story-fig");
const flat = fig && fig.querySelector("svg");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const webgl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();

if (fig && flat && webgl && !reduce && window.innerWidth > 900) {
  import("./vendor/three.module.min.js").then((THREE) => {
    const marks = [...flat.querySelectorAll(".sg")];
    const stage = document.createElement("div");
    stage.className = "story-stage";
    stage.setAttribute("aria-hidden", "true");
    flat.before(stage);
    flat.style.display = "none";

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(-3, 6, 6); scene.add(sun);

    const GAP = 1.5, N = marks.length, x0 = -((N - 1) * GAP) / 2;
    const GREY = new THREE.Color(0xb9c0b9), GREEN = new THREE.Color(0x174e3d), MINT = new THREE.Color(0x8fd6ab);
    const road = new THREE.Mesh(new THREE.BoxGeometry(N * GAP + 1.2, 0.04, 1.5), new THREE.MeshStandardMaterial({ color: 0xe6eae2 }));
    road.position.y = -0.02; scene.add(road);
    const NAMES = ["Behaviour", "Policy", "Completion", "Hand-over", "Judges", "Red team"];
    const DEFS = [
      "Behaviour: what the agent actually did, step by step, against the reviewed plan.",
      "Policy: was every action allowed by a written rule?",
      "Completion: did the run finish, and does it point to its proof?",
      "Hand-over: was a clear record left for the next person?",
      "Judges: do the AI judges that score the work agree with each other?",
      "Red team: did a deliberate attack on the model succeed?",
    ];
    const part = (geo, mat, x, y, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, 0); if (rz) m.rotation.z = rz; return m; };
    const group = (...items) => { const g = new THREE.Group(); g.add(...items); return g; };
    const ball = (r) => new THREE.SphereGeometry(r, 16, 16);
    const FIGURES = [
      (m) => group(part(ball(0.075), m, -0.24, 0.06), part(ball(0.075), m, 0, 0.2), part(ball(0.075), m, 0.24, 0.34),
        part(new THREE.BoxGeometry(0.3, 0.03, 0.03), m, -0.12, 0.13, 0.53), part(new THREE.BoxGeometry(0.3, 0.03, 0.03), m, 0.12, 0.27, 0.53)),
      (m) => group(part(new THREE.BoxGeometry(0.36, 0.26, 0.1), m, 0, 0.13), part(new THREE.TorusGeometry(0.11, 0.032, 8, 20, Math.PI), m, 0, 0.26)),
      (m) => group(part(new THREE.BoxGeometry(0.2, 0.07, 0.07), m, -0.13, 0.12, -0.8), part(new THREE.BoxGeometry(0.44, 0.07, 0.07), m, 0.1, 0.22, 0.8)),
      (m) => group(part(ball(0.095), m, -0.27, 0.14), part(ball(0.095), m, 0.27, 0.14), part(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 12), m, 0, 0.14, Math.PI / 2)),
      (m) => group(part(new THREE.BoxGeometry(0.05, 0.36, 0.05), m, 0, 0.18), part(new THREE.BoxGeometry(0.6, 0.04, 0.05), m, 0, 0.37),
        part(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20), m, -0.28, 0.22), part(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20), m, 0.28, 0.22)),
      (m) => group(part(new THREE.TorusGeometry(0.2, 0.035, 10, 28), m, 0, 0.26), part(ball(0.07), m, 0, 0.26)),
    ];
    const gates = marks.map((mark, i) => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: GREY.clone(), roughness: 0.55 });
      const post = new THREE.BoxGeometry(0.12, 1.5, 0.12);
      const left = new THREE.Mesh(post, mat); left.position.set(0, 0.75, -0.55);
      const right = new THREE.Mesh(post, mat); right.position.set(0, 0.75, 0.55);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.22), mat); top.position.set(0, 1.5, 0);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.44), new THREE.MeshBasicMaterial({ color: 0x8fd6ab, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      pane.rotation.y = Math.PI / 2; pane.position.set(0, 0.72, 0);
      const tag = document.createElement("canvas"); tag.width = 320; tag.height = 160;
      const pen = tag.getContext("2d");
      pen.fillStyle = "#174e3d"; pen.beginPath(); pen.arc(160, 44, 38, 0, Math.PI * 2); pen.fill();
      pen.fillStyle = "#ffffff"; pen.font = "700 50px Consolas, monospace"; pen.textAlign = "center"; pen.textBaseline = "middle";
      pen.fillText(String(i + 1), 160, 48);
      pen.fillStyle = "#17211e"; pen.font = "600 40px system-ui, sans-serif"; pen.fillText(NAMES[i], 160, 124);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tag), transparent: true, depthTest: false }));
      label.scale.set(1.6, 0.8, 1); label.position.set(0, 2.95, 0);
      const figure = FIGURES[i](mat); figure.position.set(0, 1.62, 0);
      g.add(left, right, top, pane, label, figure);
      g.position.x = x0 + i * GAP;
      scene.add(g);
      return { g, mat, pane, lit: 0, col: GREY.clone() };
    });
    const run = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), new THREE.MeshStandardMaterial({ color: 0x17211e, emissive: 0x174e3d, emissiveIntensity: 0.5 }));
    run.position.set(x0 - GAP * 0.7, 0.2, 0); scene.add(run);

    const size = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    };
    size(); window.addEventListener("resize", size);

    let passed = -1, current = -1, auditMode = false;
    const auditMarks = [...document.querySelectorAll("#audit-gates .gate")];
    const auditStep = document.querySelector(".story-audit");
    const VERDICT = { pass: GREEN, fail: new THREE.Color(0xc0651a), missing: new THREE.Color(0x17211e), error: new THREE.Color(0x17211e) };
    const read = () => {
      passed = -1; current = -1;
      auditMode = !!(auditStep && auditStep.classList.contains("active") && auditMarks.length === gates.length);
      if (auditMode) {
        auditMarks.forEach((m, i) => {
          const c = m.getAttribute("class") || "";
          const kind = ["pass", "fail", "missing", "error"].find((k) => c.includes(k));
          gates[i].col = kind ? VERDICT[kind] : GREY;
          if (kind) passed = i;
        });
      } else {
        marks.forEach((m, i) => { if (m.classList.contains("on")) passed = i; if (m.classList.contains("now")) current = i; });
      }
      let def = fig.querySelector(".sg-def");
      if (!def) { def = document.createElement("span"); def.className = "sg-def"; fig.querySelector("figcaption").prepend(def); }
      def.textContent = auditMode ? "Flip a switch. Each gate shows its real verdict." : current >= 0 ? DEFS[current] : passed >= 5 ? "All six gates passed." : "Scroll: the run meets one gate at a time.";
      const cap = fig.querySelector(".sg-verdict"), word = document.getElementById("audit-overall-word");
      if (cap) cap.textContent = auditMode && word ? word.textContent : "Overall: PASS";
      wake();
    };
    const watch = new MutationObserver(read);
    const overallWord = document.getElementById("audit-overall-word");
    if (overallWord) new MutationObserver(read).observe(overallWord, { childList: true, characterData: true, subtree: true });
    marks.forEach((m) => watch.observe(m, { attributes: true, attributeFilter: ["class"] }));
    auditMarks.forEach((m) => watch.observe(m, { attributes: true, attributeFilter: ["class"] }));
    if (auditStep) watch.observe(auditStep, { attributes: true, attributeFilter: ["class"] });
    stage.style.cursor = "pointer";
    stage.addEventListener("click", (ev) => {
      const r = stage.getBoundingClientRect();
      let best = -1, bd = 60;
      gates.forEach((gt, i) => {
        const p = new THREE.Vector3(gt.g.position.x, 0.8, 0).project(camera);
        const d = Math.abs((p.x * 0.5 + 0.5) * r.width - (ev.clientX - r.left));
        if (d < bd) { bd = d; best = i; }
      });
      const steps = document.querySelectorAll(".story-step");
      if (best >= 0 && steps[best] && !auditMode) steps[best].scrollIntoView({ block: "center", behavior: "smooth" });
    });

    let visible = true, frame = 0, last = 0, quietSince = 0, camX = 0;
    function wake() { quietSince = performance.now(); if (!frame && visible) frame = requestAnimationFrame(tick); }
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) wake(); }).observe(stage);
    function tick(now) {
      frame = 0;
      if (!visible || document.hidden) return;
      if (now - last >= 32) {
        last = now;
        const targetX = passed < 0 ? x0 - GAP * 0.7 : x0 + passed * GAP + (passed >= N - 1 && current < 0 ? GAP * 0.7 : 0);
        run.position.x += (targetX - run.position.x) * 0.09;
        run.position.y = 0.2 + Math.abs(Math.sin(run.position.x * 2.1)) * 0.1;
        gates.forEach((gt, i) => {
          const want = i <= passed ? 1 : 0;
          gt.lit += (want - gt.lit) * 0.1;
          if (auditMode) gt.mat.color.lerp(gt.col, 0.14); else gt.mat.color.copy(GREY).lerp(GREEN, gt.lit);
          const pulse = i === current ? 0.22 + Math.sin(now / 260) * 0.12 : 0;
          gt.pane.material.opacity = gt.lit * 0.28 + pulse;
          gt.g.scale.y += ((i === current ? 1.1 : 1) - gt.g.scale.y) * 0.12;
        });
        const focus = current >= 0 ? x0 + current * GAP : passed >= N - 1 ? 0 : run.position.x;
        camX += (focus * 0.3 - camX) * 0.05;
        camera.position.set(camX - 2.0, 2.9, 10.2);
        camera.lookAt(camX, 1.15, 0);
        renderer.render(scene, camera);
      }
      if (current >= 0 || now - quietSince < 2500) frame = requestAnimationFrame(tick);
    }
    read();
  }).catch(() => {});
}
