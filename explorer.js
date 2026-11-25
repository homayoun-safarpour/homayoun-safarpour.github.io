// Framework explorer: eight controls as pillars; a run travels through them. Buttons and keyboard always work;
// the 3D view loads only with WebGL, no reduced motion and a wide screen. three.js r165, vendored.
const DATA = [{"n": 1, "name": "Scope and permissions", "q": "May the agent do this, with these arguments, after what it has already done?", "ours": "Gate 2: every call replayed through Microsoft's policy engine, default deny.", "status": "partial", "note": "Tool names only; not arguments or call order yet.", "related": "OWASP Agentic Top 10: ASI02 tool misuse. EU AI Act Art. 9. NIST AI RMF MANAGE.", "gate": "Gate 2", "count": 9}, {"n": 2, "name": "Behaviour evidence", "q": "What did the agent actually do, step by step, not only at the end?", "ours": "Gate 1: the trace against a reviewed rubric and a pinned baseline; a forbidden call stops the run.", "status": "covered", "note": "Covered for tools and their order.", "related": "EU AI Act Art. 15. NIST AI RMF MEASURE 2.5.", "gate": "Gate 1", "count": 8}, {"n": 3, "name": "Records and traceability", "q": "Can someone else find the record of the run and check it?", "ours": "Gate 3 and the sha256 fingerprint of every file each gate read.", "status": "covered", "note": "Covered.", "related": "EU AI Act Art. 12 record-keeping.", "gate": "Gate 3", "count": 8}, {"n": 4, "name": "Human oversight and hand-over", "q": "Did a person get a usable record, and could they really step in?", "ours": "Gate 4: the hand-over record must name what was proved, what is pending, when to stop.", "status": "partial", "note": "Checks the record, not whether it is true or whether anyone intervened.", "related": "EU AI Act Art. 14 human oversight.", "gate": "Gate 4", "count": 9}, {"n": 5, "name": "Evaluation validity and judges", "q": "Is the score itself trustworthy: checked against people, repeated, free of order and wording bias?", "ours": "Gate 5: agreement between judges and each judge's consistency.", "status": "partial", "note": "No human-labelled anchor or bias probes yet. The research is loudest here.", "related": "NIST AI RMF MEASURE 2.13.", "gate": "Gate 5", "count": 28}, {"n": 6, "name": "Adversarial testing", "q": "Does a determined attack succeed, including instructions hidden in what the agent reads?", "ours": "Gate 6: a red-team report read and counted.", "status": "partial", "note": "Model scans only; not attacks through the agent's tools.", "related": "OWASP Agentic Top 10: ASI01 goal hijack. EU AI Act Art. 15. NIST AI RMF MEASURE 2.7.", "gate": "Gate 6", "count": 7}, {"n": 7, "name": "Monitoring after deployment", "q": "Does the agent behave in real use the way it did in tests?", "ours": "None yet.", "status": "gap", "note": "The clearest gap: models can tell when they are being tested.", "related": "EU AI Act Art. 72 post-market monitoring. NIST AI RMF MANAGE 4.", "gate": "None yet", "count": 4}, {"n": 8, "name": "Accountability and governance", "q": "Who answers for the result, and against which rule?", "ours": "The report itself: each tool, version, verdict and exit code; the EU requirements map.", "status": "partial", "note": "Evidence for a decision, not the decision.", "related": "EU AI Act Art. 17 quality management; harmonised standard EN 18286:2026. ISO/IEC 42001. NIST AI RMF GOVERN.", "gate": "The report", "count": 10}];
const FINDS = [[{"t": "Audit MCP authentication and authorization carefully because chained tool calls operate with delegated user permissions and can amplify a single vulnerability.", "u": "https://genai.owasp.org/resource/a-practical-guide-for-secure-mcp-server-development/", "p": "OWASP Foundation, 2026"}, {"t": "AgentCap checks authorization independently of the model and validates limited capability tokens before tools execute actions.", "u": "https://arxiv.org/abs/2611.00729", "p": "arXiv, 2026"}, {"t": "AgentGuard supports runtime auditing through a policy interface backed by checks for both individual tool calls and risks spanning multiple tools.", "u": "https://arxiv.org/abs/2605.28071", "p": "arXiv, 2026"}], [{"t": "Agents must expose what they accessed, what they did and why, while allowing their behaviour to be controlled at runtime.", "u": "https://genai.owasp.org/resource/agent-control-standard-acs/", "p": "OWASP Foundation, 2026"}, {"t": "Audit individual tool-use steps, not just final outcomes, because mistakes can cause irreversible side effects.", "u": "https://arxiv.org/abs/2603.14465", "p": "arXiv, 2026"}, {"t": "Evaluate execution time as well as accuracy, because planning, reflection, and judging calls account for most agent latency.", "u": "https://arxiv.org/abs/2506.16042", "p": "arXiv, 2025"}], [{"t": "The proposed project would link agent actions to agent identities so auditors can trace automated activity and its outcomes.", "u": "https://www.nccoe.nist.gov/sites/default/files/2026-02/accelerating-the-adoption-of-software-and-ai-agent-identity-and-authorization-concept-paper.pdf", "p": "National Institute of Standards and Technology, National Cybersecurity Center of Excellence, 2026"}, {"t": "The draft recommends documenting why a deployment decision keeps misuse risk within the organization's risk tolerance.", "u": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.800-1.ipd2.pdf", "p": "U.S. AI Safety Institute, National Institute of Standards and Technology, 2025"}, {"t": "Developers must maintain an audit trail covering the operation and lifecycle management of the system's models, datasets, and prompts.", "u": "https://www.etsi.org/deliver/etsi_en/304200_304299/304223/02.01.01_60/en_304223v020101p.pdf", "p": "European Telecommunications Standards Institute, 2025"}], [{"t": "Institutions should consider accountable human oversight of high-impact decisions, supported by auditable documentation showing how AI outputs influenced final outcomes.", "u": "https://www.osfi-bsif.gc.ca/en/risks/technology-cyber-risk-management/technology-risk-bulletin/generative-agentic-artificial-intelligence-implications-technology-cyber-security-operational", "p": "Office of the Superintendent of Financial Institutions, 2026"}, {"t": "The authors argue that effective human oversight may require evidence-based measures against overreliance on AI, not merely awareness of that risk.", "u": "https://www.cambridge.org/core/services/aop-cambridge-core/content/view/C97C85015056C09326944DE55CBC4D2C/S1867299X25100330a.pdf/div-class-title-automation-bias-in-the-ai-act-on-the-legal-implications-of-attempting-to-de-bias-human-oversight-of-ai-div.pdf", "p": "Cambridge University Press, European Journal of Risk Regulation, 2025"}, {"t": "Do not treat a human being in the loop as proof of effective oversight because automation bias can prevent people from recognising or correcting AI errors.", "u": "https://cset.georgetown.edu/publication/ai-safety-and-automation-bias/", "p": "Georgetown University, Center for Security and Emerging Technology, 2024"}], [{"t": "Check the statistical assumptions behind evaluation scores because some methods produce invalid uncertainty estimates.", "u": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.800-3.pdf", "p": "National Institute of Standards and Technology, 2026"}, {"t": "Auditors should validate an LLM judge against human judgments for the particular task before relying on its scores.", "u": "https://aclanthology.org/2025.acl-short.20/", "p": "Association for Computational Linguistics, 2025"}, {"t": "Auditors should test safety judges for sensitivity to superficial wording because apologetic language alone can substantially skew their verdicts.", "u": "https://aclanthology.org/2025.acl-long.970/", "p": "Association for Computational Linguistics, 2025"}], [{"t": "Auditors can use the guide's attack scenarios and mitigations to structure adversarial testing against documented LLM application risks.", "u": "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/", "p": "OWASP Foundation, 2026"}, {"t": "AISI found universal jailbreaks for every system it tested, so auditors should not treat installed safeguards as proof against misuse.", "u": "https://www.aisi.gov.uk/frontier-ai-trends-report", "p": "UK AI Security Institute, 2025"}, {"t": "Test whether malicious instructions in external tool results can redirect an agent into unauthorized actions.", "u": "https://arxiv.org/abs/2406.13352", "p": "arXiv, 2024"}], [{"t": "Audits need evidence from monitoring after deployment because controlled tests cannot capture changing real-world conditions.", "u": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.800-4.pdf", "p": "National Institute of Standards and Technology, 2026"}, {"t": "The concept note identifies monitoring for environmental changes beyond verified operating conditions as a trustworthiness feature for critical infrastructure AI.", "u": "https://www.nist.gov/system/files/documents/2026/04/08/Concept%20Note_%20Development%20of%20the%20NIST%20AI%20RMF%20Trustworthy%20Use%20of%20AI%20in%20Critical%20Infrastructure%20Profile.pdf", "p": "National Institute of Standards and Technology, 2026"}, {"t": "When using the monitor as audit evidence, distinguish individual incidents from news coverage because multiple articles can describe the same event.", "u": "https://oecd.ai/en/incidents", "p": "Organisation for Economic Co-operation and Development, 2023"}], [{"t": "An audit should cover risks across interacting agents as well as individual agents, matching the guide's coverage of both environments.", "u": "https://genai.owasp.org/resource/securing-agentic-applications-v2/", "p": "OWASP Foundation, 2026"}, {"t": "For auditors, the key finding is that existing cybersecurity practices need adapting to address agent-specific security risks.", "u": "https://www.nist.gov/publications/summary-analysis-responses-request-information-regarding-security-considerations-ai", "p": "National Institute of Standards and Technology, 2026"}, {"t": "The guide uses threat modeling to connect agent-specific threats with mitigations, providing a basis for auditing whether relevant risks have been addressed.", "u": "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/", "p": "OWASP Foundation, 2025"}]];
const SHORT = ["Permissions", "Behaviour", "Records", "Oversight", "Judges", "Red team", "Monitoring", "Accountability"];
const panel = document.getElementById("x-panel");
const findList = document.createElement("ul");
findList.className = "x-finds";
panel.append(findList);
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
  findList.replaceChildren(...FINDS[i].map((f) => { const li = document.createElement("li"); const a = document.createElement("a"); a.href = f.u; a.textContent = f.p + "\u00a0\u2197"; li.append(f.t + " ", a); return li; }));
  buttons.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  onSelect(i);
};
buttons.forEach((b, i) => b.addEventListener("click", () => { userTook = true; show(i); }));

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const stage = document.getElementById("x-stage");
const webgl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } })();
if (stage && webgl && !reduce && window.innerWidth >= 320) {
  import("./vendor/three.module.min.js").then((THREE) => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    stage.append(renderer.domElement);
    stage.classList.add("on");
    const key = document.createElement("p"); key.className = "x-key";
    key.innerHTML = '<span class="k k-covered"></span>covered <span class="k k-partial"></span>partial <span class="k k-gap"></span>gap';
    stage.after(key);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 7.4, 9.6);
    camera.lookAt(0, 0.7, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(3, 6, 5); scene.add(sun);
    const world = new THREE.Group(); scene.add(world);
    const COLORS = { covered: 0x3fae7a, partial: 0xd4a73c, gap: 0x8a948d };
    const R = 3.4, pillars = [];
    const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.06, R + 0.06, 96), new THREE.MeshBasicMaterial({ color: 0x5f7a6c, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
    ring.rotation.x = -Math.PI / 2; world.add(ring);
    const tagFor = (n, text) => {
      const c = document.createElement("canvas"); c.width = 480; c.height = 96;
      const g = c.getContext("2d");
      g.fillStyle = "#174e3d"; g.beginPath(); g.arc(48, 48, 34, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#fff"; g.font = "700 40px Consolas, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 48, 51);
      g.fillStyle = "#17211e"; g.font = "600 34px system-ui, sans-serif"; g.textAlign = "left"; g.fillText(text, 94, 50);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
      sp.scale.set(2.75, 0.55, 1); sp.renderOrder = 20;
      return sp;
    };
    const plateGeo = new THREE.BoxGeometry(0.66, 0.06, 0.66);
    DATA.forEach((d, i) => {
      const a = (i / DATA.length) * Math.PI * 2;
      const gap = d.status === "gap";
      const mat = gap ? new THREE.MeshStandardMaterial({ color: COLORS.gap, transparent: true, opacity: 0.25 })
        : new THREE.MeshStandardMaterial({ color: COLORS[d.status], roughness: 0.5, metalness: 0.05 });
      const stack = new THREE.Group();
      const plates = [];
      for (let k = 0; k < d.count; k += 1) {
        const plate = new THREE.Mesh(plateGeo, mat);
        plate.userData = { i };
        if (gap) plate.add(new THREE.LineSegments(new THREE.EdgesGeometry(plateGeo), new THREE.LineBasicMaterial({ color: 0x7d877f })));
        stack.add(plate); plates.push(plate);
      }
      const label = tagFor(d.n, SHORT[i] + " \u00b7 " + d.count);
      stack.add(label);
      stack.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
      stack.userData = { i, plates, label, spread: 0, height: 0.68 * Math.sqrt(d.count / 8) };
      world.add(stack); pillars.push(stack);
    });
    const centre = document.createElement("canvas"); centre.width = 512; centre.height = 256;
    const centreTex = new THREE.CanvasTexture(centre);
    const centreSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: centreTex, transparent: true, depthTest: false }));
    centreSprite.scale.set(3.0, 1.5, 1); centreSprite.position.set(0, 0.45, 0); centreSprite.renderOrder = 10; world.add(centreSprite);
    let shownCount = -1;
    const writeCentre = (n) => {
      if (n === shownCount) return;
      shownCount = n;
      const g = centre.getContext("2d"); g.clearRect(0, 0, 512, 256);
      g.fillStyle = "rgba(248,247,242,0.86)"; g.beginPath(); g.roundRect(56, 22, 400, 206, 26); g.fill();
      g.textAlign = "center"; g.fillStyle = "#174e3d"; g.font = "400 96px Georgia, serif"; g.fillText(n + " of 8", 256, 110);
      g.fillStyle = "#17211e"; g.font = "600 30px system-ui, sans-serif"; g.fillText("controls checked on this run", 256, 160);
      g.fillStyle = "#4d5954"; g.font = "500 24px system-ui, sans-serif"; g.fillText("83 verified findings behind them", 256, 200);
      centreTex.needsUpdate = true;
    };
    writeCentre(0);
    const run = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), new THREE.MeshStandardMaterial({ color: 0x17211e, emissive: 0x3fae7a, emissiveIntensity: 0.5 }));
    world.add(run);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 48), new THREE.MeshBasicMaterial({ color: 0x174e3d, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
    halo.rotation.x = -Math.PI / 2; world.add(halo);
    let target = 0;
    onSelect = (i) => {
      const p = pillars[i];
      halo.position.set(p.position.x, 0.02, p.position.z);
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
        const hit = ray.intersectObjects(pillars, true).find((h) => h.object.userData.i !== undefined);
        if (hit) { userTook = true; show(hit.object.userData.i); }
      }
      drag = null;
    });
    let visible = true, last = 0, frame = 0, t0 = performance.now(), lastAuto = performance.now(), autoSteps = 0;
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) frame = requestAnimationFrame(tick); }).observe(stage);
    function tick(now) {
      if (!visible || document.hidden) return;
      frame = requestAnimationFrame(tick);
      if (now - last < 32) return;
      last = now;
      const t = (now - t0) / 1000;
      const lap0 = (t % 12) / 12;
      if (!drag && !userTook) target += 0.0025;
      pillars.forEach((q, k) => {
        const u = q.userData;
        u.spread += ((k === selected ? 1 : 0) - u.spread) * 0.12;
        const step = u.height / u.plates.length + u.spread * 0.03;
        u.plates.forEach((pl, n) => { pl.position.y = 0.04 + n * step; pl.rotation.y = u.spread * n * 0.12; });
        u.label.position.y = 0.04 + u.plates.length * step + 0.42;
        u.label.material.opacity = 1 - u.spread * 0.5;
      });
      writeCentre(DATA.slice(0, Math.min(8, Math.floor(lap0 * 8 + 0.5))).filter((d) => d.status !== "gap").length);
      spin += (target - spin) * 0.08;
      world.rotation.y = spin;
      const lap = (t % 12) / 12, a = lap * Math.PI * 2;
      run.position.set(Math.sin(a) * R, 0.25 + Math.abs(Math.sin(a * 4)) * 0.15, Math.cos(a) * R);
      const near = Math.round(lap * DATA.length) % DATA.length;
      const gapNow = DATA[near].status === "gap" && Math.abs(lap * DATA.length - Math.round(lap * DATA.length)) < 0.18;
      run.material.emissive.setHex(gapNow ? 0xd9781f : 0x3fae7a);
      // One pass through the eight controls, back to the first, then the panel waits for the visitor.
      if (!userTook && autoSteps < DATA.length && now - lastAuto > 4500) { lastAuto = now; autoSteps += 1; show((selected + 1) % DATA.length); }
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(tick);
  }).catch(() => {});
}
