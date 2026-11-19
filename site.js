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
      fill.style.transition = "width .9s ease-out";
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
        card.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
      } else if (was.left !== now.left || was.top !== now.top) {
        card.animate([{ transform: "translate(" + (was.left - now.left) + "px," + (was.top - now.top) + "px)" }, { transform: "none" }],
          { duration: 260, easing: "ease-out" });
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
const auditClass = (word) => (word === "PASS" ? "good" : word === "FAIL" ? "hold" : "unknown");
const gateClass = (word) => (word === "PASS" ? "pass" : word === "FAIL" ? "fail" : "error");
const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
let auditTimers = [];

function auditItem(step) {
  const item = document.createElement("li");
  const verdict = document.createElement("span");
  const body = document.createElement("div");
  const question = document.createElement("p");
  const said = document.createElement("p");
  const tool = document.createElement("span");
  verdict.className = "audit-verdict " + auditClass(step.verdict);
  verdict.textContent = step.verdict;
  question.className = "audit-question";
  question.textContent = step.question;
  if (step.optional) {
    const optional = document.createElement("span");
    optional.className = "audit-optional";
    optional.textContent = "optional";
    question.append(" ", optional);
  }
  said.className = "audit-said";
  tool.className = "audit-tool";
  tool.textContent = step.tool;
  said.append(tool, " " + step.evidence_line);
  body.append(question, said);
  item.append(verdict, body);
  return item;
}

function showAudit(animate, quiet) {
  const key = ["fault-refund", "fault-judges", "fault-handoff"].map((id) => (pick(id).checked ? "1" : "0")).join("");
  const run = audit.combinations[key];
  if (!run) return;
  auditTimers.forEach(clearTimeout);
  auditTimers = [];
  const svg = pick("audit-gates");
  const gates = [...svg.querySelectorAll(".gate")];
  const token = pick("audit-token");
  const items = run.steps.map(auditItem);
  const place = (point) => token.setAttribute("transform", "translate(" + point.replace(",", " ") + ")");
  const reveal = (index) => {
    const step = run.steps[index];
    gates[index].setAttribute("class", "gate " + gateClass(step.verdict));
    gates[index].querySelector(".gate-word").textContent = step.verdict;
    items[index].classList.remove("pending");
  };
  const finish = () => {
    place(svg.dataset.end);
    token.setAttribute("class", "token " + auditClass(run.overall));
    pick("audit-overall").className = "verdict " + auditClass(run.overall);
    pick("audit-overall-word").textContent = "Overall: " + run.overall;
    pick("audit-exit").textContent = "exit " + run.exit_code;
    const passed = run.steps.filter((step) => step.verdict === "PASS").length;
    const caught = run.steps.filter((step) => step.verdict !== "PASS").map((step) => step.id.replace(/^[0-9a-z]+-/, "") + " " + step.verdict);
    pick("audit-status").textContent = "Overall: " + run.overall + ". " + passed + " of " + run.steps.length + " gates passed" +
      (caught.length ? ". Caught at: " + caught.join(", ") + "." : ".");
  };
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
  pick("audit-overall").className = "verdict unknown";
  pick("audit-overall-word").textContent = "Running the gates";
  pick("audit-exit").textContent = "";
  if (!quiet) pick("audit-status").textContent = "Running the gates.";
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
  ["fault-refund", "fault-judges", "fault-handoff"].forEach((id) => pick(id).addEventListener("change", () => showAudit(true)));
  pick("audit-replay").addEventListener("click", () => showAudit(true));
  pick("audit-options").hidden = false;
  showAudit(false);
  if (canWatch && !reduce.matches) {
    let played = false;
    const stopFirstPlay = () => { played = true; };
    ["fault-refund", "fault-judges", "fault-handoff", "audit-replay"].forEach((id) => pick(id).addEventListener("click", stopFirstPlay));
    const gateWatch = new IntersectionObserver((entries) => {
      if (played || !entries.some((entry) => entry.isIntersecting)) return;
      played = true;
      gateWatch.disconnect();
      showAudit(true, true);
    }, { threshold: 0.6 });
    gateWatch.observe(pick("audit-gates"));
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
  document.querySelectorAll(".count[data-to]").forEach((node) => countWatch.observe(node));

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
