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
    const gates = marks.map((mark, i) => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: GREY.clone(), roughness: 0.55 });
      const post = new THREE.BoxGeometry(0.12, 1.5, 0.12);
      const left = new THREE.Mesh(post, mat); left.position.set(0, 0.75, -0.55);
      const right = new THREE.Mesh(post, mat); right.position.set(0, 0.75, 0.55);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.22), mat); top.position.set(0, 1.5, 0);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.44), new THREE.MeshBasicMaterial({ color: 0x8fd6ab, transparent: true, opacity: 0, side: THREE.DoubleSide }));
      pane.rotation.y = Math.PI / 2; pane.position.set(0, 0.72, 0);
      const tag = document.createElement("canvas"); tag.width = tag.height = 96;
      const pen = tag.getContext("2d");
      pen.fillStyle = "#174e3d"; pen.beginPath(); pen.arc(48, 48, 40, 0, Math.PI * 2); pen.fill();
      pen.fillStyle = "#ffffff"; pen.font = "700 52px Consolas, monospace"; pen.textAlign = "center"; pen.textBaseline = "middle";
      pen.fillText(String(i + 1), 48, 52);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tag), transparent: true }));
      label.scale.set(0.5, 0.5, 1); label.position.set(0, 2.0, 0);
      g.add(left, right, top, pane, label);
      g.position.x = x0 + i * GAP;
      scene.add(g);
      return { g, mat, pane, lit: 0 };
    });
    const run = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), new THREE.MeshStandardMaterial({ color: 0x17211e, emissive: 0x174e3d, emissiveIntensity: 0.5 }));
    run.position.set(x0 - GAP * 0.7, 0.2, 0); scene.add(run);

    const size = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
    };
    size(); window.addEventListener("resize", size);

    let passed = -1, current = -1;
    const read = () => {
      passed = -1; current = -1;
      marks.forEach((m, i) => { if (m.classList.contains("on")) passed = i; if (m.classList.contains("now")) current = i; });
      wake();
    };
    const watch = new MutationObserver(read);
    marks.forEach((m) => watch.observe(m, { attributes: true, attributeFilter: ["class"] }));

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
          gt.mat.color.copy(GREY).lerp(GREEN, gt.lit);
          const pulse = i === current ? 0.22 + Math.sin(now / 260) * 0.12 : 0;
          gt.pane.material.opacity = gt.lit * 0.28 + pulse;
          gt.g.scale.y += ((i === current ? 1.1 : 1) - gt.g.scale.y) * 0.12;
        });
        const focus = current >= 0 ? x0 + current * GAP : passed >= N - 1 ? 0 : run.position.x;
        camX += (focus * 0.3 - camX) * 0.05;
        camera.position.set(camX - 2.0, 2.5, 9.4);
        camera.lookAt(camX, 0.75, 0);
        renderer.render(scene, camera);
      }
      if (current >= 0 || now - quietSince < 2500) frame = requestAnimationFrame(tick);
    }
    read();
  }).catch(() => {});
}
