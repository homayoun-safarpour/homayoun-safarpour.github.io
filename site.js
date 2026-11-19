"use strict";

const demo = window.TRACE_GATE_DEMO;
const pick = (id) => document.getElementById(id);
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const canWatch = "IntersectionObserver" in window;
const narratives = [
  { calls: [["read", "Allowed call"]], text: "The known trace clears the baseline and has no forbidden calls." },
  { calls: [["read", "Allowed call"], ["deny_0", "Forbidden call"]], text: "The score clears the floor, but the second call violates policy. The check fails." },
  { calls: [["demo", "Known case · score shown"], ["not-pinned", "Absent from baseline"]], text: "The 1.0000 belongs to demo, the known case. The run still fails because not-pinned has no baseline entry." },
];

function showCase(index) {
  const run = demo.cases[index];
  const narrative = narratives[index];
  if (!run || !narrative) return;

  const items = narrative.calls.map(([name, reason], position) => {
    const item = document.createElement("li");
    const code = document.createElement("code");
    const label = document.createElement("span");
    code.textContent = name;
    label.textContent = reason;
    item.classList.toggle("flag", position > 0);
    item.append(code, label);
    return item;
  });
  pick("trace-label").textContent = index === 2 ? "Cases checked" : "Tool calls";
  pick("trace").replaceChildren(...items);

  const output = run.result.details.map((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    return item;
  });
  pick("cli-output").replaceChildren(...output);
  const score = run.first_case_score.composite;
  pick("score-label").textContent = index === 2
    ? "Score for " + run.first_case_score.trajectory_name
    : "Composite score";
  pick("score").textContent = score.toFixed(4);
  pick("score-fill").style.width = score * 100 + "%";
  pick("score-floor").style.left = demo.quality_floor * 100 + "%";
  pick("floor").textContent = "Baseline floor " + demo.quality_floor.toFixed(4);
  pick("verdict-strip").className = "verdict " + (run.result.ok ? "good" : "hold");
  pick("verdict").textContent = run.result.verdict;
  pick("exit").textContent = "exit " + run.exit_code;
  pick("explanation").textContent = narrative.text;
}

if (demo) {
  document.querySelectorAll('input[name="demo-case"]').forEach((input) => {
    input.addEventListener("change", () => showCase(Number(input.value)));
  });
  showCase(Number(document.querySelector('input[name="demo-case"]:checked').value));
  if (!reduce.matches) {
    const fill = pick("score-fill");
    const target = fill.style.width;
    fill.style.transition = "none";
    fill.style.width = "0%";
    pick("verdict-strip").classList.add("arrive");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = "width .9s cubic-bezier(.23,1,.32,1)";
      fill.style.width = target;
      setTimeout(() => { fill.style.transition = ""; }, 1000);
    }));
  }
  pick("case-options").hidden = false;
  pick("cli-evidence").hidden = false;
} else {
  pick("explanation").textContent = "The replay data could not load. The saved clean example is shown.";
}

const cards = [...document.querySelectorAll(".grid article")];
const buttons = [...document.querySelectorAll("[data-filter]")];
const search = pick("search");
let topic = "all";

function filterProjects(animate) {
  const words = search.value.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  const move = animate === true && !reduce.matches && typeof document.body.animate === "function";
  const before = new Map();
  if (move) cards.forEach((card) => { if (!card.hidden) before.set(card, card.getBoundingClientRect()); });
  let visible = 0;
  for (const card of cards) {
    const text = card.textContent.toLowerCase();
    const matches = (topic === "all" || topic === card.dataset.topic) &&
      words.every((word) => text.includes(word));
    card.hidden = !matches;
    if (matches) visible += 1;
  }
  if (move) {
    cards.forEach((card) => {
      if (card.hidden) return;
      const now = card.getBoundingClientRect();
      const was = before.get(card);
      if (!was) {
        card.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(.23,1,.32,1)" });
      } else if (was.left !== now.left || was.top !== now.top) {
        card.animate([{ transform: "translate(" + (was.left - now.left) + "px," + (was.top - now.top) + "px)" }, { transform: "none" }],
          { duration: 260, easing: "cubic-bezier(.77,0,.175,1)" });
      }
    });
  }
  pick("project-count").textContent = visible + (visible === 1 ? " project" : " projects");
  pick("empty").hidden = visible !== 0;
}

function selectTopic(value) {
  topic = value;
  buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === value)));
  filterProjects(true);
}

buttons.forEach((button) => button.addEventListener("click", () => selectTopic(button.dataset.filter)));
search.addEventListener("input", () => filterProjects(true));
pick("clear").addEventListener("click", () => {
  search.value = "";
  selectTopic("all");
  search.focus();
});
filterProjects();
pick("project-filters").hidden = false;

const audit = window.AI_USE_AUDIT;
const FAULTS = ["fault-refund", "fault-cutoff", "fault-handoff", "fault-judges", "fault-jailbreak"];
const auditClass = (word) => (word === "PASS" ? "good" : word === "FAIL" ? "hold" : "unknown");
const gateClass = (word) => (word === "PASS" ? "pass" : word === "FAIL" ? "fail" : word === "MISSING" ? "missing" : "error");
const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
const openNotes = new Set();
let auditTimers = [];

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gateCard(gate, step, index) {
  const item = make("li");
  item.dataset.gate = String(index + 1);
  const head = make("div", "gc-head");
  const body = make("div");
  const title = make("p", "gc-title");
  title.append(make("span", "gc-n", String(index + 1)), make("span", "", gate.name), make("span", "gc-tool", gate.tool));
  if (gate.optional) title.append(make("span", "audit-optional", "optional"));
  body.append(title, make("p", "audit-question", gate.question), make("p", "audit-said", step.said));
  head.append(make("span", "audit-verdict " + auditClass(step.verdict), step.verdict), body);
  const more = make("details", "gc-more");
  more.open = openNotes.has(index);
  more.addEventListener("toggle", () => (more.open ? openNotes.add(index) : openNotes.delete(index)));
  const list = make("dl");
  const row = (label, value) => {
    const dd = make("dd");
    if (typeof value === "string") dd.textContent = value; else dd.append(value);
    list.append(make("dt", "", label), dd);
  };
  row("Checks", gate.checks);
  row("PASS means", gate.pass);
  row("PASS does not prove", gate.not);
  row("Fails when", gate.fails);
  row("Related to", gate.related);
  if (step.output.length) row("The tool said", make("pre", "gc-out", step.output.join("\n")));
  const files = Object.entries(step.files);
  row("Evidence read", files.length ? files.map(([name, sha]) => name + " sha256 " + sha).join(", ") : step.said);
  more.append(make("summary", "", "What this gate means"), list);
  item.append(head, more);
  return item;
}

function runRows(combo) {
  const who = { user: "Customer", assistant: "Agent", tool: "Tool" };
  return combo.run.map((s) => {
    const item = make("li", s.fault ? "run-fault" : "");
    item.append(make("span", "run-who", who[s.role] || s.role), make("span", "run-text", s.tool ? s.tool + "(" + s.text + ")" : s.text));
    return item;
  });
}

function showAudit(animate) {
  const key = FAULTS.map((id) => (pick(id).checked ? "1" : "0")).join("");
  const run = audit.combinations[key];
  if (!run) return;
  auditTimers.forEach(clearTimeout);
  auditTimers = [];
  const svg = pick("audit-gates");
  const gates = [...svg.querySelectorAll(".gate")];
  const token = pick("audit-token");
  const items = run.steps.map((step, index) => gateCard(audit.gates[index], step, index));
  const place = (point) => token.setAttribute("transform", "translate(" + point.replace(",", " ") + ")");
  const reveal = (index) => {
    const step = run.steps[index];
    gates[index].setAttribute("class", "gate " + gateClass(step.verdict));
    gates[index].querySelector(".gate-word").textContent = step.verdict;
    items[index].classList.remove("pending");
    if (animate && !calm.matches) {
      gates[index].classList.add(step.verdict === "PASS" ? "hit" : "shake");
      items[index].classList.add("flash");
    }
  };
  const finish = () => {
    svg.classList.remove("running");
    place(svg.dataset.end);
    token.setAttribute("class", "token " + auditClass(run.overall));
    pick("audit-overall").className = "verdict " + auditClass(run.overall);
    pick("audit-overall-word").textContent = "Overall: " + run.overall;
    pick("audit-exit").textContent = "exit " + run.exit_code;
    const passed = run.steps.filter((step) => step.verdict === "PASS").length;
    const caught = run.steps.map((step, index) => (step.verdict === "PASS" ? "" : "gate " + (index + 1) + " " + step.verdict)).filter(Boolean);
    pick("audit-status").textContent = "Overall: " + run.overall + ". " + passed + " of " + run.steps.length + " gates passed" +
      (caught.length ? ". Caught at " + caught.join(", ") + "." : ".");
  };
  pick("audit-run-steps").replaceChildren(...runRows(run));
  pick("audit-run-meta").textContent = "support-4412 · synthetic · trace sha256 " + run.trace_sha;
  pick("audit-steps").replaceChildren(...items);
  if (!animate || calm.matches) {
    run.steps.forEach((step, index) => reveal(index));
    finish();
    return;
  }
  gates.forEach((gate) => {
    gate.setAttribute("class", "gate");
    gate.querySelector(".gate-word").textContent = "";
  });
  items.forEach((item) => item.classList.add("pending"));
  token.setAttribute("class", "token");
  svg.classList.add("running");
  pick("audit-overall").className = "verdict unknown";
  pick("audit-overall-word").textContent = "Running the gates";
  pick("audit-exit").textContent = "";
  pick("audit-status").textContent = "Running the gates.";
  token.classList.add("jump");
  place(svg.dataset.start);
  auditTimers.push(setTimeout(() => token.classList.remove("jump"), 60));
  run.steps.forEach((step, index) => {
    const when = 140 + index * 620;
    auditTimers.push(setTimeout(() => place(gates[index].dataset.x + "," + gates[index].dataset.y), when));
    auditTimers.push(setTimeout(() => reveal(index), when + 430));
  });
  auditTimers.push(setTimeout(finish, 140 + run.steps.length * 620 + 200));
}

if (audit) {
  FAULTS.forEach((id) => pick(id).addEventListener("change", () => showAudit(true)));
  pick("audit-replay").addEventListener("click", () => showAudit(true));
  pick("audit-options").hidden = false;
  showAudit(false);
  if (canWatch && !reduce.matches) {
    const boxes = FAULTS.map((id) => pick(id));
    const autoButton = pick("audit-auto");
    const status = pick("audit-status");
    const tour = ["00000", "10000", "01000", "00100", "00010", "00001"];
    const MOST = tour.length * 3;
    let on = true, seen = false, timer = 0, at = 0, shown = 0;
    const label = () => {
      autoButton.textContent = "Auto demo: " + (on ? "on" : "off");
      autoButton.setAttribute("aria-pressed", String(on));
      status.setAttribute("aria-live", on ? "off" : "polite");
    };
    const next = () => {
      clearTimeout(timer);
      if (!on || !seen || document.hidden) return;
      if (shown >= MOST) { on = false; label(); return; }
      const key = tour[at % tour.length];
      boxes.forEach((box, index) => { box.checked = key[index] === "1"; });
      showAudit(true);
      at += 1;
      shown += 1;
      timer = setTimeout(next, 7600);
    };
    const takeOver = () => { if (on) { on = false; clearTimeout(timer); label(); } };
    boxes.forEach((box) => box.addEventListener("click", takeOver));
    pick("audit-replay").addEventListener("click", takeOver);
    pick("audit-steps").addEventListener("click", (event) => { if (event.target.closest("summary")) takeOver(); });
    autoButton.addEventListener("click", () => {
      on = !on;
      shown = 0;
      label();
      if (on) next(); else clearTimeout(timer);
    });
    autoButton.hidden = false;
    label();
    new IntersectionObserver((entries) => {
      seen = entries.some((entry) => entry.isIntersecting);
      if (seen) next(); else clearTimeout(timer);
    }, { threshold: 0.5 }).observe(pick("audit-gates"));
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else next(); });
  }
}

if (canWatch && !reduce.matches) {
  const countUp = (node) => {
    const target = Number(node.dataset.to);
    const began = performance.now();
    const step = (now) => {
      const part = Math.min(1, (now - began) / 900);
      const eased = 1 - Math.pow(1 - part, 3);
      node.textContent = Math.round(target * eased).toLocaleString("en-GB");
      if (part < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countWatch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countWatch.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".num[data-to]").forEach((node) => countWatch.observe(node));

  const sections = [...document.querySelectorAll("main > section:not(.hero)")];
  const sectionWatch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionWatch.unobserve(entry.target);
      entry.target.classList.add("in");
    });
  }, { threshold: 0.06 });
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top < window.innerHeight * 0.9) return;   // already on screen: leave it alone
    section.classList.add("reveal");
    sectionWatch.observe(section);
  });
}

const net = pick("net");
if (net && net.getContext) {
  const ctx = net.getContext("2d");
  const hero = net.parentElement;
  let points = [];
  let wide = 0;
  let high = 0;
  let frame = 0;
  let running = false;
  let pointer = null;
  let aim = null;
  let retired = false;
  const size = () => {
    const box = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    wide = box.width;
    high = box.height;
    net.width = Math.round(wide * ratio);
    net.height = Math.round(high * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(18, Math.min(80, Math.round((wide * high) / 14000)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * wide,
      y: Math.random() * high,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
    }));
  };
  const line = (a, b, colour) => {
    ctx.strokeStyle = colour;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const draw = () => {
    ctx.clearRect(0, 0, wide, high);
    ctx.lineWidth = 1;
    if (aim) {
      pointer = pointer ? { x: pointer.x + (aim.x - pointer.x) * 0.12, y: pointer.y + (aim.y - pointer.y) * 0.12 } : { ...aim };
    } else {
      pointer = null;
    }
    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > wide) p.vx *= -1;
      if (p.y < 0 || p.y > high) p.vy *= -1;
    }
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        const gap = Math.hypot(a.x - b.x, a.y - b.y);
        if (gap < 150) line(a, b, "rgba(23,78,61," + (0.17 * (1 - gap / 150)).toFixed(3) + ")");
      }
      if (pointer) {
        const gap = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (gap < 190) line(a, pointer, "rgba(173,116,13," + (0.4 * (1 - gap / 190)).toFixed(3) + ")");
      }
      ctx.fillStyle = "rgba(23,78,61,.38)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const loop = () => {
    draw();
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || reduce.matches || retired) return;
    running = true;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  size();
  draw();
  if (!reduce.matches) {
    start();
    if (canWatch) new IntersectionObserver((entries) => (entries[0].isIntersecting ? start() : stop())).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    hero.addEventListener("pointermove", (event) => {
      const box = hero.getBoundingClientRect();
      aim = { x: event.clientX - box.left, y: event.clientY - box.top };
    });
    hero.addEventListener("pointerleave", () => { aim = null; });
  }
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (!retired) { size(); draw(); } }, 150);
  });

  const webgl = (() => {
    try { const test = document.createElement("canvas"); return !!(test.getContext("webgl2") || test.getContext("webgl")); }
    catch (error) { return false; }
  })();
  if (webgl && !reduce.matches && window.innerWidth > 640) {
    const later = window.requestIdleCallback || ((fn) => setTimeout(fn, 600));
    window.addEventListener("load", () => later(() => {
      import("./net3d.js").then((mod) => mod.start(hero, () => {
        retired = true;
        stop();
        net.classList.add("off");
      })).catch(() => { /* the 2D network simply stays */ });
    }));
  }
}

const bar = pick("progress");
if (bar) {
  const update = () => {
    const room = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (room > 0 ? Math.min(1, window.scrollY / room) : 0).toFixed(4) + ")";
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

if (!reduce.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const tilt = (selector, most) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const box = el.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        el.style.transition = "transform 160ms cubic-bezier(.23,1,.32,1)";
        el.style.transform = "perspective(900px) rotateX(" + (-y * most).toFixed(2) + "deg) rotateY(" + (x * most).toFixed(2) + "deg)";
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform 420ms cubic-bezier(.23,1,.32,1)";
        el.style.transform = "";
      });
    });
  };
  tilt(".demo", 3);
  tilt(".twin figure", 6);
  tilt(".facts article", 5);
}

const twinCard = pick("twin");
if (twinCard) {
  const word = pick("world");
  const FROM = "REAL";
  const TO = "VIRTUAL";
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  const story = () => {
    const box = twinCard.getBoundingClientRect();
    const high = window.innerHeight;
    const away = Math.abs(box.top + box.height / 2 - high / 2);
    let shift = 1 - Math.min(1, Math.max(0, (away - high * 0.15) / (high * 0.9)));
    shift = shift * shift * (3 - 2 * shift);
    window.storyShift = shift;
    twinCard.classList.toggle("virtual", shift > 0.55);
    twinCard.style.setProperty("--lit", shift.toFixed(3));
    if (reduce.matches) return;
    document.body.style.backgroundColor = "rgb(" + mix(248, 236, shift) + "," + mix(247, 226, shift) + "," + mix(242, 208, shift) + ")";
    const top = box.top + window.scrollY - high / 2;
    const part = Math.min(1, Math.max(0, window.scrollY / Math.max(1, top)));
    const typed = Math.round(part * (FROM.length + TO.length));
    word.textContent = typed <= FROM.length ? FROM.slice(0, FROM.length - typed) : TO.slice(0, typed - FROM.length);
    word.classList.toggle("virtual", shift > 0.55);
  };
  window.addEventListener("scroll", story, { passive: true });
  window.addEventListener("resize", story);
  story();
}

if (!reduce.matches) {
  let waiting = [];
  const mark = (selector, step) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      el.classList.add("rise");
      el.style.setProperty("--i", String(step ? index % 3 : 0));
      waiting.push(el);
    });
  };
  mark(".hook", false);
  mark(".audit-report", false);
  mark(".grid article", true);
  mark(".steps details", true);
  mark(".twin figure", false);
  const arrive = () => {
    if (!waiting.length) return;
    const line = window.innerHeight * 0.88;
    waiting = waiting.filter((el) => {
      if (el.getBoundingClientRect().top > line) return true;
      el.classList.add("in");
      return false;
    });
    if (!waiting.length) window.removeEventListener("scroll", arrive);
  };
  window.addEventListener("scroll", arrive, { passive: true });
  window.addEventListener("resize", arrive);
  const soon = () => setTimeout(arrive, 60);
  document.addEventListener("click", soon);
  document.addEventListener("input", soon);
  document.addEventListener("keyup", soon);
  document.addEventListener("visibilitychange", arrive);
  if (canWatch) {
    const net = new IntersectionObserver(arrive, { threshold: 0.05 });
    waiting.forEach((el) => net.observe(el));
  }
  arrive();
}
