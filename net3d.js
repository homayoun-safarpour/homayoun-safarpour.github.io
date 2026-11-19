// 3D point network behind the first screen. Loaded only after the page has drawn, only where WebGL works,
// only on screens wider than 640 px, and never when the visitor asks for reduced motion.
// Library: three.js r165 (MIT), vendored in vendor/ so nothing is fetched from another site.
import * as THREE from "./vendor/three.module.min.js";

export function start(hero, onReady) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.className = "net3d";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const COUNT = 420;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i += 1) {
    const u = Math.random() * 2 - 1;
    const angle = Math.random() * Math.PI * 2;
    const radius = 3.4 * Math.cbrt(Math.random());
    const ring = Math.sqrt(1 - u * u);
    positions[i * 3] = radius * ring * Math.cos(angle) * 1.9;
    positions[i * 3 + 1] = radius * u * 0.95;
    positions[i * 3 + 2] = radius * ring * Math.sin(angle);
  }
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dot = document.createElement("canvas");
  dot.width = dot.height = 32;
  const g = dot.getContext("2d");
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.45, "rgba(255,255,255,.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const pointMaterial = new THREE.PointsMaterial({
    color: 0x174e3d, size: 0.085, map: new THREE.CanvasTexture(dot), transparent: true, opacity: 0.48, depthWrite: false,
  });
  const cloud = new THREE.Group();
  cloud.add(new THREE.Points(pointGeometry, pointMaterial));

  const near = (i, k) => {
    const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
    const best = [];
    for (let j = 0; j < COUNT; j += 1) {
      if (j === i) continue;
      const dx = positions[j * 3] - ax, dy = positions[j * 3 + 1] - ay, dz = positions[j * 3 + 2] - az;
      const d = dx * dx + dy * dy + dz * dz;
      if (best.length < k) best.push([d, j]);
      else if (d < best[k - 1][0]) best[k - 1] = [d, j];
      best.sort((p, q) => p[0] - q[0]);
    }
    return best.map((p) => p[1]);
  };
  const lines = [];
  const warmLines = [];
  for (let i = 0; i < COUNT; i += 4) {
    const target = i % 28 === 0 ? warmLines : lines;
    for (const j of near(i, 3)) {
      target.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
    }
  }
  const lineSet = (values, colour, opacity) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(values), 3));
    return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false }));
  };
  cloud.add(lineSet(lines, 0x174e3d, 0.11));
  cloud.add(lineSet(warmLines, 0xad740d, 0.3));
  scene.add(cloud);

  const resize = () => {
    const box = { width: window.innerWidth, height: window.innerHeight };
    renderer.setSize(box.width, box.height, false);
    camera.aspect = box.width / Math.max(1, box.height);
    camera.updateProjectionMatrix();
  };
  resize();

  let aimX = 0, aimY = 0, tiltX = 0, tiltY = 0, frame = 0, running = false;
  const calm = new THREE.Color(0x174e3d);
  const glow = new THREE.Color(0xff963c);
  const green = new THREE.Color(0x174e3d);
  const began = performance.now();
  window.addEventListener("pointermove", (event) => {
    aimX = (event.clientX / window.innerWidth - 0.5) * 0.5;
    aimY = (event.clientY / window.innerHeight - 0.5) * 0.3;
  }, { passive: true });
  let lastDraw = 0, lastMove = performance.now();
  const render = (now) => {
    if (now - lastDraw < 32) { frame = requestAnimationFrame(render); return; }
    lastDraw = now;
    const t = (now - began) / 1000;
    tiltX += (aimY - tiltX) * 0.05;
    tiltY += (aimX - tiltY) * 0.05;
    cloud.rotation.y = t * 0.045 + tiltY;
    cloud.rotation.x = Math.sin(t * 0.12) * 0.08 + tiltX;
    const scrolled = Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));
    const shift = window.storyShift || 0;
    camera.position.z = 9 + scrolled * 3 - shift * 4.5;
    green.lerpColors(calm, glow, shift);
    pointMaterial.color.copy(green);
    pointMaterial.opacity = 0.48 + shift * 0.4;
    canvas.style.opacity = String(Math.max(1 - scrolled * 0.7, shift * 0.95).toFixed(3));
    renderer.render(scene, camera);
    if (scrolled >= 1 && shift < 0.02 && now - lastMove > 4000) { running = false; return; }
    frame = requestAnimationFrame(render);
  };
  const play = () => { if (!running) { running = true; frame = requestAnimationFrame(render); } };
  const pause = () => { running = false; cancelAnimationFrame(frame); };
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));
  const wake = () => { lastMove = performance.now(); if (!document.hidden) play(); };
  window.addEventListener("scroll", wake, { passive: true });
  window.addEventListener("pointermove", wake, { passive: true });
  let timer = 0;
  window.addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(resize, 150); });
  renderer.render(scene, camera);
  play();
  requestAnimationFrame(() => { canvas.style.opacity = "1"; onReady(); });
}
