// Check your own agent: five yes/no answers map to the gates and open tools that apply. Runs in the browser only.
const box = document.getElementById("check");
if (box) {
  const GH = "https://github.com/homayoun-safarpour/";
  const RULES = {
    tools: { yes: ["Gate 2, Policy: replay every tool call against a written allow list.", "agent-constraint-auditor"],
             no: ["Gate 2 matters less while the agent only reads. Keep its allow list empty by default.", ""] },
    records: { yes: ["Gate 1, Behaviour: compare each recorded run with an approved one and fail CI when it gets worse.", "trace-gate"],
               no: ["Start here: without a record of each run there is nothing to check. Save the request, tool calls and reply.", "agent-eval-workbench", "first"] },
    people: { yes: ["Gate 4, Hand-over: check that the person receives a record of what was proved and what is pending.", "homi-gate"],
              no: ["Gates 3 and 4 still help: a finished run should leave a receipt someone else can read.", "homi-gate"] },
    judges: { yes: ["Gate 5, Judges: test whether the judges agree with each other and with people, and whether a judge has drifted.", "judge-reliability-kit"],
              no: ["Gate 5 can wait until you grade answers automatically.", ""] },
    outside: { yes: ["Gate 6, Red team: text from outside can carry hidden instructions. Test retrieval and block instruction overrides.", "rag-eval-service"],
               no: ["Gate 6 still applies to the model itself: run a red-team scan before release.", ""] },
  };
  const out = box.querySelector(".sc-out");
  const draw = () => {
    const picked = [...box.querySelectorAll("input:checked")].map((i) => [i.name.slice(3), i.value]);
    if (!picked.length) return;
    const list = document.createElement("ol");
    const rows = picked.map(([k, v]) => { const [text, repo, first] = RULES[k][v]; return { text, repo, first: !!first, need: v === "yes" || !!first }; })
      .sort((a, b) => (b.first - a.first) || (b.need - a.need));
    rows.forEach(({ text, repo, first, need }) => {
      const li = document.createElement("li");
      li.className = first ? "sc-first" : need ? "sc-need" : "sc-later";
      li.append(text);
      if (repo) { const a = document.createElement("a"); a.href = GH + repo; a.textContent = " " + repo + "\u00a0\u2197"; li.append(a); }
      list.append(li);
    });
    const done = picked.length === 5 ? "" : " Answer the rest for the full list.";
    const head = document.createElement("p");
    head.className = "sc-head";
    const n = rows.filter((r) => r.need).length;
    head.textContent = n + (n === 1 ? " step applies" : " steps apply") + " to your agent, most urgent first." + done;
    out.replaceChildren(head, list);
  };
  box.addEventListener("change", draw);
}

// Timeline markers follow today's date: filled = applies now, orange = the next date, open = later.
const steps = [...document.querySelectorAll(".at-line li")];
if (steps.length) {
  const now = Date.now();
  let nextSet = false;
  steps.forEach((li) => {
    const [d, m, y] = li.querySelector("time").textContent.trim().split(" ");
    const when = new Date(Number(y), "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m) / 3, Number(d)).getTime();
    li.classList.remove("at-past", "at-next", "at-later");
    if (when <= now) li.classList.add("at-past");
    else if (!nextSet) { li.classList.add("at-next"); nextSet = true; }
    else li.classList.add("at-later");
  });
}
