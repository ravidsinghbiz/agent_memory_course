/* ======================================================================
   The Agent Memory Stack — single-page app
   Vanilla JS. Hash router, theme toggle, SSE-over-fetch streaming client,
   one interactive view per memory layer. Backend: memorizz + Oracle/FS.
   ====================================================================== */

// ── icons ──────────────────────────────────────────────────────────────
const I = {
  stack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 16.5l9 5 9-5"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z"/></svg>',
  rag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5.5" rx="7" ry="2.7"/><path d="M5 5.5v6c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7v-6"/><path d="M5 11.5v6c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7v-6"/></svg>',
  flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="6" rx="1.5"/><rect x="14" y="9" width="7" height="6" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/><path d="M10 6h2.5a1.5 1.5 0 0 1 1.5 1.5V9M10 18h2.5a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>',
  agent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="14" height="12" rx="2.5"/><path d="M12 7V4M9 3.5h6M9 12h.01M15 12h.01M9.5 16h5"/></svg>',
  id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 9h4M15 13h4"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13.5A8 8 0 1 1 10.5 4 6.3 6.3 0 0 0 20 13.5Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 16-8-6 16-3-7-7-1Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 4v4h-4M21 12a9 9 0 0 1-15.5 6.2L3 16M3 20v-4h4"/></svg>',
  reload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>',
  tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6l-9 9a2.1 2.1 0 0 1-3-3l9-9a3.5 3.5 0 0 1-1.6-1.6Z"/></svg>',
  bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M5 9h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM9 13h.01M15 13h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9 17.5 20 6.5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  cache: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7.5C4 5.6 7.6 4 12 4s8 1.6 8 3.5S16.4 11 12 11 4 9.4 4 7.5Z"/><path d="M4 7.5V12c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V7.5M4 12v4.5c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V12"/><path d="m15.7 6.2-2.2 2.6-1.1-1.1"/></svg>',
  compress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/><path d="m3 8 6-6M21 8l-6-6M3 16l6 6M21 16l-6 6"/><rect x="8" y="8" width="8" height="8" rx="2"/></svg>',
  window: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 9v11"/><path d="M5.5 6.5h.01M8 6.5h.01"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  collapse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6-6 6 6 6"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m9.5 6 6 6-6 6"/></svg>',
};

// ── memory layers ─────────────────────────────────────────────────────
const FF = [
  {
    id: "conversation", rung: 1, nav: "Conversation", icon: I.chat, accent: "var(--r1)",
    title: "Episodic Conversation Memory", kicker: "Layer 01 — Remember the dialogue",
    desc: "A MemAgent backed by Oracle (or a filesystem fallback) that remembers across turns — and across a process restart. Reload the agent from storage by its id and watch it still recall who you are.",
    term: "<b>Episodic memory</b> (<code>CONVERSATION_MEMORY</code>): the time-stamped record of interactions. <code>agent.run()</code> retrieves prior turns, reasons, then persists the new ones — automatically.",
    meta: { Type: "Episodic", Store: "CONVERSATION_MEMORY", Survives: "Restarts" },
  },
  {
    id: "semantic", rung: 2, nav: "Persona & Entities", icon: I.id, accent: "var(--r2)",
    title: "Semantic Memory", kicker: "Layer 02 — Identity & facts",
    desc: "A stable persona (identity, voice) plus entity memory: tell the agent durable facts about people, services, and systems, and it records them as structured entities it can recall precisely.",
    term: "<b>Semantic memory</b> (<code>PERSONAS</code> + <code>ENTITY_MEMORY</code>): durable identity and facts, not events. Use it for who-the-agent-is and what-is-true.",
    meta: { Type: "Semantic", Store: "PERSONAS · ENTITY_MEMORY", Recall: "Structured" },
  },
  {
    id: "knowledge", rung: 3, nav: "Knowledge Base", icon: I.rag, accent: "var(--r3)",
    title: "Knowledge Base — RAG", kicker: "Layer 03 — Ground in your docs",
    desc: "Ingest documents via memorizz KnowledgeBase, retrieve the most relevant passages by vector search, then answer grounded only in them — with bracketed citations. Oracle AI Database, or filesystem fallback.",
    term: "<b>Semantic memory</b> (<code>KNOWLEDGE_BASE</code>): long-term document memory. Chunk → embed → vector-search → ground the answer. This is RAG, living inside the memory system.",
    meta: { Type: "Semantic", Store: "KNOWLEDGE_BASE", Retrieval: "Vector" },
  },
  {
    id: "procedural", rung: 4, nav: "Procedural", icon: I.tool, accent: "var(--r4)",
    title: "Procedural Memory", kicker: "Layer 04 — How to act",
    desc: "How an agent acts: callable tools it can invoke, a stored workflow (runbook) recalled by intent, and a skillbox of how-to guides retrieved as a manifest. Watch each piece resolve, then the agent answers.",
    term: "<b>Procedural memory</b> (<code>TOOLBOX</code> · <code>WORKFLOW_MEMORY</code> · skillbox): tools, runbooks, and guides — the agent's skills, retrievable by intent.",
    meta: { Type: "Procedural", Store: "TOOLBOX · WORKFLOW", Acts: "Via tools" },
  },
  {
    id: "coordination", rung: 5, nav: "Coordination", icon: I.agent, accent: "var(--r5)",
    title: "Shared Memory — Multi-Agent", kicker: "Layer 05 — A coordinating team",
    desc: "The top layer: a lead orchestrator delegates to a Researcher and a Reviewer that collaborate over a shared blackboard, then the lead synthesizes one recommendation. Built on memorizz's MultiAgentOrchestrator.",
    term: "<b>Shared memory</b> (<code>SHARED_MEMORY</code>): a blackboard multiple agents read and write — commands, reports, artifacts — so a team can coordinate with a common trail.",
    meta: { Type: "Social", Store: "SHARED_MEMORY", Agents: "Lead + 2" },
  },
  {
    id: "unified", rung: 6, nav: "Complete Stack", icon: I.stack, accent: "var(--r6)",
    title: "The Complete Agent Memory Stack", kicker: "Stage 06 — Observe the whole system",
    desc: "One production-shaped chat combines every memory partition, then exposes the exact model context, semantic-cache decisions, generated summary IDs, compacted source messages, and offloaded tool-result pointers for every turn.",
    term: "<b>Effective context</b> is the literal message set sent to the model — not everything stored. This lab separates durable memory, retrieved memory, response reuse, and context compaction so you can inspect each boundary.",
    meta: { Type: "Integrated", Store: "All 13 partitions", Evidence: "Per turn" },
  },
];
const FF_BY_ID = Object.fromEntries(FF.map((f) => [f.id, f]));

// ── tiny utils ─────────────────────────────────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function renderRich(text) {
  let h = esc(text);
  h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/`([^`]+?)`/g, "<code>$1</code>");
  h = h.replace(/\[(\d+)\]/g, '<span class="cite">[$1]</span>');
  return h.split(/\n{2,}/).map((p) => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
}

// SSE-over-fetch: POST a JSON body, parse the text/event-stream response.
async function streamSSE(url, body, onEvent, signal) {
  try { resetCtxRail(); } catch (_) {}
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error("HTTP " + res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const SEP = /\r?\n\r?\n/;
    let m;
    while ((m = SEP.exec(buf))) {
      const block = buf.slice(0, m.index);
      buf = buf.slice(m.index + m[0].length);
      let event = "message", data = "";
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith(":")) continue;
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).replace(/^\s/, "");
      }
      if (event === "end") return;
      if (data) {
        try {
          const obj = JSON.parse(data);
          if (obj && obj.type === "context") { try { updateCtxRail(obj); } catch (_) {} }
          else if (obj && (obj.type === "architecture" || obj.type === "flow" || obj.type === "agent_context")) { try { handleCoordEvent(obj); } catch (_) {} }
          onEvent(obj);
        } catch (_) {}
      }
    }
  }
}

async function getJSON(url) { const r = await fetch(url); return r.json(); }
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let data = {}; try { data = await r.json(); } catch (_) {}
  if (!r.ok) throw new Error(data.detail || data.message || `HTTP ${r.status}`);
  return data;
}

// ── app state ──────────────────────────────────────────────────────────
const state = {
  health: null,
  session: uid(),     // shared conversation id for stateful layers
  abort: null,
  unifiedSnapshot: null,
  unifiedUnit: "chat",
};
const explorerState = {
  tables: [], selected: null, result: null, offset: 0, limit: 40,
  events: [], active: new Map(), recent: new Map(), source: null,
  refreshTimer: null, preferredTable: "conversation_memory",
};
const SIDEBAR_STORAGE_KEY = "amem-sidebar";
function cancelStream() { if (state.abort) { try { state.abort.abort(); } catch (_) {} state.abort = null; } }

// ── sidebar ──────────────────────────────────────────────────────────
function renderSidebar(activeId) {
  const items = [
    `<a class="nav-item nav-home ${activeId === "home" ? "active" : ""}" href="#/" aria-label="Overview" title="Overview" style="--c:var(--text-2);animation-delay:0ms">
       <span class="nav-node">${I.home}</span><span class="nav-label">Overview</span>
     </a>`,
    ...FF.map((f, i) => `
      <a class="nav-item ${activeId === f.id ? "active" : ""}" href="#/${f.id}" aria-label="${esc(`${f.rung}. ${f.nav}`)}" title="${esc(`${f.rung}. ${f.nav}`)}" style="--c:${f.accent};animation-delay:${(i + 1) * 55}ms">
        <span class="nav-node">${f.rung}</span>
        <span class="nav-label">${f.nav}</span>
        <span class="nav-rung">${f.icon}</span>
      </a>`),
  ].join("");

  $("#sidebar").innerHTML = `
    <div class="brand">
      <span class="brand-glyph">${I.stack}</span>
      <span class="brand-text"><b>Memory Stack</b><span>Six observable stages</span></span>
      <button class="sidebar-toggle" id="sidebar-toggle" type="button" aria-controls="sidebar-nav"></button>
    </div>
    <div class="rail-label">The Stack</div>
    <nav class="ladder-rail" id="sidebar-nav" aria-label="Agent memory layers">${items}</nav>
    <div class="sidebar-foot">
      <div class="status-card" id="status-card">${statusInner()}</div>
      <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle color theme" title="Toggle color theme">
        <span style="display:flex;align-items:center;gap:8px">${themeIcon()} <span id="theme-label">${themeLabel()}</span></span>
        <span class="toggle-track"></span>
      </button>
    </div>`;

  syncSidebarToggle();
  $("#sidebar-toggle").addEventListener("click", toggleSidebar);
  $("#theme-toggle").addEventListener("click", toggleTheme);
}

function sidebarCollapsed() {
  return document.documentElement.getAttribute("data-sidebar") === "collapsed";
}

function syncSidebarToggle() {
  const toggle = $("#sidebar-toggle");
  if (!toggle) return;
  const collapsed = sidebarCollapsed();
  const label = collapsed ? "Expand side navigation" : "Collapse side navigation";
  toggle.innerHTML = collapsed ? I.expand : I.collapse;
  toggle.setAttribute("aria-label", label);
  toggle.setAttribute("title", label);
  toggle.setAttribute("aria-expanded", String(!collapsed));
}

function toggleSidebar() {
  const next = sidebarCollapsed() ? "expanded" : "collapsed";
  document.documentElement.setAttribute("data-sidebar", next);
  try { localStorage.setItem(SIDEBAR_STORAGE_KEY, next); } catch (_) {}
  syncSidebarToggle();
}

function statusInner() {
  const h = state.health;
  if (!h) return `<div class="status-row"><span class="dot pulse"></span><span class="muted">Connecting…</span></div>`;
  const mem = h.memory || {};
  const ready = mem.ready;
  const backend = mem.backend === "oracle" ? "Oracle AI DB" : mem.backend === "filesystem" ? "Filesystem" : "warming…";
  const mdot = !ready ? "warn pulse" : "ok";
  const kdot = h.api_key_set ? "ok" : "off";
  return `
    <div class="status-row"><span class="k">Model</span><span class="mono" style="color:var(--text)">${esc(h.model)}</span></div>
    <div class="status-row"><span class="k">Memory</span><span class="dot ${mdot}"></span><span>${backend}</span></div>
    <div class="status-row"><span class="k">OpenAI key</span><span class="dot ${kdot}"></span><span>${h.api_key_set ? "set" : "missing"}</span></div>`;
}

function themeIcon() { return document.documentElement.getAttribute("data-theme") === "light" ? I.sun : I.moon; }
function themeLabel() { return document.documentElement.getAttribute("data-theme") === "light" ? "Light" : "Dark"; }
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("amem-theme", next); } catch (_) {}
  $("#theme-label").textContent = themeLabel();
  $("#theme-toggle").querySelector("svg").outerHTML = themeIcon();
}
function refreshStatus() { const c = $("#status-card"); if (c) c.innerHTML = statusInner(); }

// ── header / shells ──────────────────────────────────────────────────
function ffHeader(f) {
  return `
    <header class="ff-head">
      <div class="ff-numeral">${f.rung}</div>
      <div class="ff-head-body">
        <div class="ff-kicker">${esc(f.kicker)}</div>
        <h1 class="ff-title">${esc(f.title)}</h1>
        <p class="ff-desc">${esc(f.desc)}</p>
        <div class="ff-term">${f.term}</div>
      </div>
    </header>`;
}
function setStage(html, accent) {
  const stage = $("#stage");
  stage.style.setProperty("--accent", accent || "var(--r5)");
  stage.innerHTML = `<div class="view view-enter">${html}</div>`;
  stage.scrollTop = 0;
}
function backendLabel() {
  const b = state.health && state.health.memory && state.health.memory.backend;
  return b === "oracle" ? "Oracle AI Database" : b === "filesystem" ? "filesystem (FAISS)" : "warming…";
}

// ── view: home ─────────────────────────────────────────────────────────
function viewHome() {
  const rungs = FF.map((f, i) => `
    <a class="rung" href="#/${f.id}" style="--c:${f.accent};animation-delay:${i * 70 + 80}ms">
      <div class="rung-num">${f.rung}</div>
      <div class="rung-main">
        <h3>${esc(f.nav)} <span class="muted" style="font-weight:400;font-size:14px">· ${esc(f.title)}</span></h3>
        <p>${esc(f.desc)}</p>
      </div>
      <div class="rung-meta">
        ${Object.entries(f.meta).map(([k, v]) => `<div class="meta-line"><span class="mk">${k}</span><span class="mv">${esc(v)}</span></div>`).join("")}
      </div>
      <div class="rung-go">${I.arrow}</div>
    </a>`).join("");

  setStage(`
    <section class="hero">
      <div class="hero-kicker"><span class="pip"></span> The Agent Memory Stack</div>
      <h1>Grow an agent from a goldfish into a colleague — <em>one memory layer at a time</em>.</h1>
      <p>One copilot — <b>Memo</b>, for a fictional <b>Acme Cloud</b> platform team — built up across five memory layers, then assembled into one observable final system with the <b>memorizz</b> framework on <b>Oracle AI Database</b> (with a filesystem fallback). Each stage adds a capability the stage below was missing.</p>
    </section>
    <section class="home-explorer" aria-labelledby="home-explorer-title">
      <div class="home-explorer-mark">${I.db}</div>
      <div class="home-explorer-copy">
        <div class="home-explorer-kicker">Live memory storage</div>
        <h2 id="home-explorer-title">Memory Data Explorer</h2>
        <p>Inspect the allowlisted MemoRizz tables, their columns, scoped rows, and live read/write activity in the active memory provider.</p>
        <div class="home-explorer-summary" id="home-explorer-summary">${esc($("#explorer-summary")?.textContent || "Connecting to the application database…")}</div>
      </div>
      <button class="btn btn-accent" id="home-explorer-open" type="button">${I.db} Open Data Explorer</button>
    </section>
    <div class="ladder">${rungs}</div>`, "var(--r5)");

  $("#home-explorer-open").addEventListener("click", () => toggleExplorer(true));
}

// ── view: conversation (Layer 1) ─────────────────────────────────────────
function viewConversation() {
  const f = FF_BY_ID.conversation;
  setStage(`${ffHeader(f)}
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">${I.chat} Conversation</span>
        <div class="row">
          <button class="btn btn-ghost" id="reload-agent" title="Reconstruct the agent from storage by its id">${I.reload} Reload from storage</button>
          <button class="btn btn-ghost" id="new-chat">${I.refresh} New chat</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="chat-wrap">
          <div class="chat-scroll" id="chat-scroll">
            <div class="empty">Tell Memo something about you and your work, then ask it later. It persists to ${esc(backendLabel())}.</div>
          </div>
          <div class="memory-note" id="mem-note"></div>
          <div class="composer">
            <textarea id="chat-input" placeholder="Message Memo…  (e.g. I'm Ada, migrating our RAG stack to Oracle 23ai)" rows="1"></textarea>
            <button class="btn btn-accent" id="chat-send">${I.send} Send</button>
          </div>
        </div>
      </div>
    </div>`, f.accent);

  const scroll = $("#chat-scroll"), input = $("#chat-input"), send = $("#chat-send");
  let first = true;

  async function send_(url, body, label) {
    if (state.abort) return;
    if (first) { scroll.innerHTML = ""; first = false; }
    const bubble = addMsg(scroll, "bot", "");
    bubble.innerHTML = '<span class="caret"></span>';
    send.disabled = true;
    let acc = "";
    state.abort = new AbortController();
    try {
      await streamSSE(url, body, (ev) => {
        if (ev.type === "reloaded") { bubble.innerHTML = `<span class="muted">↻ reloaded agent <span class="mono">${esc((ev.agent_id||"").slice(0,8))}</span> from ${esc(ev.backend||"")}…</span><br>` ; }
        else if (ev.type === "delta") { acc += ev.text; bubble.innerHTML = renderRich(acc) + '<span class="caret"></span>'; scroll.scrollTop = scroll.scrollHeight; }
        else if (ev.type === "done") {
          bubble.innerHTML = renderRich(acc);
          const note = ev.reloaded ? `recalled after reload · agent <b class="mono">${esc((ev.agent_id||"").slice(0,8))}</b> · ${esc(ev.backend||"")}`
                                   : `persisted to <b>${esc(ev.backend||"")}</b> · turn <b>${ev.turns}</b> · agent <span class="mono">${esc((ev.agent_id||"").slice(0,8))}</span>`;
          $("#mem-note").innerHTML = note;
        } else if (ev.type === "error") { bubble.innerHTML = `<span style="color:var(--r5)">${esc(ev.message)}</span>`; }
      }, state.abort.signal);
    } catch (e) { bubble.innerHTML = `<span style="color:var(--r5)">Error: ${esc(e.message)}</span>`; }
    finally { state.abort = null; send.disabled = false; input.focus(); }
  }

  async function sendMsg() {
    const text = input.value.trim();
    if (!text) return;
    input.value = ""; autosize(input);
    addMsg(scroll, "user", text);
    await send_("/api/conversation/message", { session_id: state.session, message: text });
  }

  send.addEventListener("click", sendMsg);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } });
  input.addEventListener("input", () => autosize(input));
  $("#reload-agent").addEventListener("click", () => {
    if (first) { scroll.innerHTML = ""; first = false; }
    addMsg(scroll, "user", "⟳ (simulated restart) — recall what you know about me");
    send_("/api/conversation/reload", { session_id: state.session, message: "" });
  });
  $("#new-chat").addEventListener("click", async () => {
    cancelStream();
    await fetch("/api/conversation/reset?session_id=" + state.session, { method: "POST" }).catch(() => {});
    state.session = uid();
    scroll.innerHTML = `<div class="empty">New conversation. A fresh agent with empty memory.</div>`;
    $("#mem-note").innerHTML = ""; first = true;
  });
  input.focus();
}

function addMsg(scroll, role, text) {
  if (scroll.querySelector(".empty")) scroll.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "msg " + role;
  wrap.innerHTML = `<div class="avatar ${role}">${role === "bot" ? I.bot : "YOU"}</div><div class="bubble">${role === "bot" ? "" : renderRich(text)}</div>`;
  scroll.appendChild(wrap);
  scroll.scrollTop = scroll.scrollHeight;
  return wrap.querySelector(".bubble");
}
function autosize(el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }

// ── view: semantic (Layer 2) ─────────────────────────────────────────────
const SEM_SAMPLES = [
  "For the record: our on-call tool is PagerPilot, and Ada owns it.",
  "I'm Ada, a senior ML engineer; my current project is the RAG migration to Oracle 23ai.",
  "Who owns PagerPilot, and what is my current project?",
];
function viewSemantic() {
  const f = FF_BY_ID.semantic;
  setStage(`${ffHeader(f)}
    <div class="grid-2 mb">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${I.id} Persona</span></div>
        <div class="panel-body"><div id="sem-persona" class="persona"><div class="empty">Loading persona…</div></div></div>
      </div>
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${I.db} Entity memory</span><button class="btn btn-ghost" id="sem-refresh">${I.refresh}</button></div>
        <div class="panel-body"><div id="sem-entities" class="sources"><div class="empty">Facts you state become structured entities here.</div></div></div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="panel-title">${I.chat} Talk to Memo</span></div>
      <div class="panel-body">
        <div class="field">
          <textarea id="sem-input" rows="1" placeholder="State a fact, or ask Memo to recall one…">${esc(SEM_SAMPLES[0])}</textarea>
          <button class="btn btn-accent" id="sem-send">${I.send} Send</button>
        </div>
        <div class="chips" style="margin-top:12px">${SEM_SAMPLES.map((s) => `<button class="chip">${esc(s.slice(0, 40))}…</button>`).join("")}</div>
        <div id="sem-answer" class="bubble" style="margin-top:14px"><div class="empty">Memo answers in character, recording and recalling facts.</div></div>
      </div>
    </div>`, f.accent);

  getJSON("/api/semantic/persona").then((d) => renderPersona(d.persona)).catch(() => {});
  loadEntities();
  const input = $("#sem-input"), sendb = $("#sem-send");
  $$(".chip", $("#stage")).forEach((c, i) => c.addEventListener("click", () => { input.value = SEM_SAMPLES[i]; autosize(input); }));

  async function ask() {
    const msg = input.value.trim(); if (!msg || state.abort) return;
    const ans = $("#sem-answer"); ans.innerHTML = '<span class="caret"></span>';
    sendb.disabled = true; let acc = "";
    state.abort = new AbortController();
    try {
      await streamSSE("/api/semantic/message", { session_id: state.session, message: msg }, (ev) => {
        if (ev.type === "delta") { acc += ev.text; ans.innerHTML = renderRich(acc) + '<span class="caret"></span>'; }
        else if (ev.type === "done") { ans.innerHTML = renderRich(acc) || `<div class="empty">No answer.</div>`; if (ev.entities) renderEntities(ev.entities); }
        else if (ev.type === "error") { ans.innerHTML = `<span style="color:var(--r5)">${esc(ev.message)}</span>`; }
      }, state.abort.signal);
    } catch (e) { ans.innerHTML = `<span style="color:var(--r5)">Error: ${esc(e.message)}</span>`; }
    finally { state.abort = null; sendb.disabled = false; }
  }
  sendb.addEventListener("click", ask);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } });
  input.addEventListener("input", () => autosize(input));
  $("#sem-refresh").addEventListener("click", loadEntities);
  autosize(input);
}
function renderPersona(p) {
  const box = $("#sem-persona"); if (!box) return;
  if (!p) { box.innerHTML = `<div class="empty">No persona.</div>`; return; }
  box.innerHTML = `
    <div class="persona-name">${esc(p.name)} <span class="tag ok">${esc(p.role)}</span></div>
    <div class="kv2"><span class="mk">Goals</span><span>${esc(p.goals)}</span></div>
    <div class="kv2"><span class="mk">Background</span><span>${esc(p.background)}</span></div>`;
}
async function loadEntities() { try { const d = await getJSON(`/api/semantic/entities?session_id=${encodeURIComponent(state.session)}`); renderEntities(d.entities); } catch (_) {} }
function renderEntities(list) {
  const box = $("#sem-entities"); if (!box) return;
  if (!list || !list.length) { box.innerHTML = `<div class="empty">No entities yet — state a durable fact.</div>`; return; }
  box.innerHTML = list.map((e, i) => `
    <div class="source" style="animation-delay:${i * 50}ms">
      <div class="source-top"><span class="source-title">${esc(e.name)}</span><span class="source-cat">${esc(e.entity_type || "entity")}</span></div>
      <div class="source-body">${(e.attributes && e.attributes.length) ? e.attributes.map((a) => `<span class="kv">${esc(a.name)} <b>${esc(a.value)}</b></span>`).join(" ") : '<span class="muted">no attributes captured</span>'}</div>
    </div>`).join("");
}

// ── view: knowledge (Layer 3) ────────────────────────────────────────────
const KB_SAMPLES = [
  "What is the exact API rate limit on the Pro plan?",
  "How long are backups retained?",
  "Which plans include SSO?",
  "Can I change my project's region after creation?",
];
function viewKnowledge() {
  const f = FF_BY_ID.knowledge;
  setStage(`${ffHeader(f)}
    <div class="panel mb">
      <div class="panel-body">
        <div class="row spread mb"><span class="hint">Ask about <b>Acme Cloud</b> — answered only from the ingested docs.</span><span class="hint" id="kb-backend"></span></div>
        <div class="field">
          <textarea id="kb-input" rows="1" placeholder="Ask about Acme Cloud…"></textarea>
          <button class="btn btn-accent" id="kb-ask">${I.send} Ask</button>
        </div>
        <div class="chips" style="margin-top:12px">${KB_SAMPLES.map((s) => `<button class="chip">${esc(s)}</button>`).join("")}</div>
      </div>
    </div>
    <div class="grid-2">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${I.bot} Grounded answer</span></div>
        <div class="panel-body"><div id="kb-answer" class="bubble" style="background:transparent;border:none;padding:0"><div class="empty">The answer cites its sources like [1].</div></div></div>
      </div>
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${I.rag} Retrieved context</span></div>
        <div class="panel-body"><div id="kb-sources" class="sources"><div class="empty">Retrieved passages appear here.</div></div></div>
      </div>
    </div>`, f.accent);

  const input = $("#kb-input"), ask = $("#kb-ask");
  $$(".chip", $("#stage")).forEach((c) => c.addEventListener("click", () => { input.value = c.textContent; runKB(); }));

  async function runKB() {
    const q = input.value.trim(); if (!q || state.abort) return;
    const ans = $("#kb-answer"), src = $("#kb-sources");
    ans.innerHTML = '<span class="caret"></span>'; src.innerHTML = `<div class="empty"><span class="spinner" style="display:inline-block"></span> retrieving…</div>`;
    ask.disabled = true; let acc = "";
    state.abort = new AbortController();
    try {
      await streamSSE("/api/knowledge/answer", { query: q, k: 4 }, (ev) => {
        if (ev.type === "sources") {
          $("#kb-backend").innerHTML = `backend: <b class="mono" style="color:var(--accent)">${ev.backend === "oracle" ? "Oracle AI Database" : "filesystem (FAISS)"}</b>`;
          src.innerHTML = ev.hits.length ? ev.hits.map((h, i) => sourceCard(h, i)).join("") : `<div class="empty">No matches.</div>`;
        } else if (ev.type === "delta") { acc += ev.text; ans.innerHTML = renderRich(acc) + '<span class="caret"></span>'; }
        else if (ev.type === "done") { ans.innerHTML = renderRich(acc) || `<div class="empty">No answer.</div>`; }
        else if (ev.type === "error") { ans.innerHTML = `<span style="color:var(--r5)">${esc(ev.message)}</span>`; src.innerHTML = `<div class="empty">—</div>`; }
      }, state.abort.signal);
    } catch (e) { ans.innerHTML = `<span style="color:var(--r5)">Error: ${esc(e.message)}</span>`; }
    finally { state.abort = null; ask.disabled = false; }
  }
  ask.addEventListener("click", runKB);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runKB(); } });
  input.addEventListener("input", () => autosize(input));
  input.focus();
}
function sourceCard(h, i) {
  return `<div class="source" style="animation-delay:${i * 50}ms">
    <div class="source-top"><span class="source-idx">${i + 1}</span><span class="source-title">${esc(h.title)}</span><span class="source-cat">${esc(h.category)}</span><span class="source-score">${(+h.score).toFixed(3)}</span></div>
    <div class="source-body">${esc(h.content)}</div></div>`;
}

// ── pipeline rendering (shared by procedural + coordination) ──────────────
function addStage(pipe, step, labels) {
  if (pipe.querySelector(".empty")) pipe.innerHTML = "";
  const row = document.createElement("div");
  row.className = "stage-row running";
  row.dataset.step = step;
  row.innerHTML = `<div class="stage-rail"><div class="stage-dot"><span class="spinner"></span></div><div class="stage-line"></div></div>
    <div class="stage-card"><div class="stage-name">${esc(labels[step] || step)} <span class="stage-sub">working…</span></div><div class="stage-content"></div></div>`;
  pipe.appendChild(row); return row;
}

// ── view: procedural (Layer 4) ───────────────────────────────────────────
const PROC_SAMPLES = [
  "Is the vector-search-svc healthy right now?",
  "We expect 2,000,000 requests/month at ~800 tokens each. Estimate monthly input cost.",
  "Our retrieval service is down — what's our process, and what should I check first?",
];
const PROC_LABELS = { tools: "Tools available", workflow: "Workflow recalled", skill: "Skill recalled", answer: "Agent answer" };
function viewProcedural() {
  const f = FF_BY_ID.procedural;
  setStage(`${ffHeader(f)}
    <div class="panel mb">
      <div class="panel-body">
        <div class="field">
          <textarea id="pr-input" rows="2" placeholder="Ask something that needs a tool, a runbook, or a skill…">${esc(PROC_SAMPLES[0])}</textarea>
          <button class="btn btn-accent" id="pr-run">${I.play} Run</button>
        </div>
        <div class="chips" style="margin-top:12px">${PROC_SAMPLES.map((s) => `<button class="chip">${esc(s.slice(0, 44))}…</button>`).join("")}</div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="panel-title">${I.tool} Procedural memory in action</span><span class="hint mono" id="pr-status"></span></div>
      <div class="panel-body"><div class="pipeline" id="pr-pipe"><div class="empty">Run to see tools, a recalled workflow, a skill, then the answer.</div></div></div>
    </div>`, f.accent);

  const input = $("#pr-input"), run = $("#pr-run"), pipe = $("#pr-pipe");
  $$(".chip", $("#stage")).forEach((c, i) => c.addEventListener("click", () => { input.value = PROC_SAMPLES[i]; autosize(input); }));

  async function runProc() {
    const message = input.value.trim(); if (!message || state.abort) return;
    pipe.innerHTML = ""; run.disabled = true; $("#pr-status").textContent = "running…";
    const pending = {}; let answerRow = null, acc = "";
    state.abort = new AbortController();
    try {
      await streamSSE("/api/procedural/run", { message }, (ev) => {
        if (ev.type === "step") {
          if (ev.status === "running") pending[ev.step] = addStage(pipe, ev.step, PROC_LABELS);
          else fillProc(pending[ev.step] || addStage(pipe, ev.step, PROC_LABELS), ev.step, ev.data || {});
        } else if (ev.type === "delta") {
          if (!answerRow) { answerRow = pending.answer || addStage(pipe, "answer", PROC_LABELS); answerRow.className = "stage-row done"; $(".stage-dot", answerRow).innerHTML = I.bot; $(".stage-name", answerRow).innerHTML = "Agent answer"; }
          acc += ev.text; $(".stage-content", answerRow).innerHTML = renderRich(acc);
          pipe.scrollTop = pipe.scrollHeight;
        } else if (ev.type === "final") { $("#pr-status").textContent = "done"; }
        else if (ev.type === "error") { pipe.insertAdjacentHTML("beforeend", `<div class="banner warn">${I.alert}<div>${esc(ev.message)}</div></div>`); }
      }, state.abort.signal);
    } catch (e) { pipe.insertAdjacentHTML("beforeend", `<div class="banner warn">${I.alert}<div>Error: ${esc(e.message)}</div></div>`); }
    finally { state.abort = null; run.disabled = false; }
  }
  run.addEventListener("click", runProc);
  autosize(input);
}
function fillProc(row, step, data) {
  if (!row) return;
  row.className = "stage-row done";
  const dot = $(".stage-dot", row), name = $(".stage-name", row), content = $(".stage-content", row);
  dot.innerHTML = I.check;
  if (step === "tools") {
    name.innerHTML = `Tools available <span class="stage-sub">toolbox</span>`;
    content.innerHTML = `<div class="chips">${(data.tools || []).map((t) => `<span class="chip" style="cursor:default" title="${esc(t.desc)}">${esc(t.name)}</span>`).join("")}</div>`;
  } else if (step === "workflow") {
    name.innerHTML = `Workflow recalled <span class="stage-sub">WORKFLOW_MEMORY</span>`;
    content.innerHTML = data.workflow ? `<b>${esc(data.workflow.name)}</b> <span class="muted">→ ${(data.workflow.steps || []).map(esc).join(" · ")}</span>` : `<span class="muted">No workflow matched.</span>`;
  } else if (step === "skill") {
    name.innerHTML = `Skill recalled <span class="stage-sub">skillbox manifest</span>`;
    content.innerHTML = data.skill ? `<b>${esc(data.skill.name)}</b> <span class="muted">— ${esc(data.skill.description)}</span>` : `<span class="muted">No skill matched.</span>`;
  } else if (step === "answer") {
    name.innerHTML = `Agent answer <span class="stage-sub">uses tools as needed</span>`;
  }
}

// ── view: coordination (Layer 5) ─────────────────────────────────────────
const CO_SAMPLES = [
  "Should we move our embeddings from text-embedding-3-small (256d) to a larger model? Weigh quality vs cost and recommend.",
  "Is it worth adding a semantic cache in front of our support agent? Give a recommendation.",
  "Should we switch our vector index from HNSW to IVF for our workload?",
];
function viewCoordination() {
  const f = FF_BY_ID.coordination;
  setStage(`${ffHeader(f)}
    <div class="panel mb">
      <div class="panel-body">
        <div class="field">
          <textarea id="co-input" rows="2" placeholder="Give the team a decision to make…">${esc(CO_SAMPLES[0])}</textarea>
          <button class="btn btn-accent" id="co-run">${I.play} Run team</button>
        </div>
        <div class="chips" style="margin-top:12px">${CO_SAMPLES.map((s) => `<button class="chip">${esc(s.slice(0, 44))}…</button>`).join("")}</div>
        <div class="hint" style="margin-top:10px">Lead delegates to <span class="mono" style="color:var(--accent)">Researcher</span> + <span class="mono" style="color:var(--accent)">Reviewer</span> over shared memory — <b>watch the live agentic flow in the right pane →</b> and hover any agent to see its context window. Several LLM calls, so give it a moment.</div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="panel-title">${I.bot} Synthesized recommendation</span><span class="hint mono" id="co-status"></span></div>
      <div class="panel-body"><div id="co-answer" class="bubble" style="background:transparent;border:none;padding:0"><div class="empty">The Lead's final recommendation streams here once the specialists report back — the agents' instructions and reports appear live in the right pane.</div></div></div>
    </div>`, f.accent);

  const input = $("#co-input"), run = $("#co-run"), ans = $("#co-answer");
  $$(".chip", $("#stage")).forEach((c, i) => c.addEventListener("click", () => { input.value = CO_SAMPLES[i]; autosize(input); }));

  async function runCo() {
    const prompt = input.value.trim(); if (!prompt || state.abort) return;
    ans.innerHTML = '<span class="caret"></span>'; run.disabled = true;
    $("#co-status").innerHTML = '<span class="spinner" style="display:inline-block"></span> coordinating…';
    let acc = "";
    state.abort = new AbortController();
    try {
      await streamSSE("/api/coordination/run", { prompt }, (ev) => {
        if (ev.type === "delta") { acc += ev.text; ans.innerHTML = renderRich(acc) + '<span class="caret"></span>'; }
        else if (ev.type === "final") { ans.innerHTML = renderRich(acc) || renderRich(ev.reply || ""); $("#co-status").textContent = "done"; }
        else if (ev.type === "error") { ans.innerHTML = `<span style="color:var(--r5)">${esc(ev.message)}</span>`; $("#co-status").textContent = "error"; }
      }, state.abort.signal);
    } catch (e) { ans.innerHTML = `<span style="color:var(--r5)">Error: ${esc(e.message)}</span>`; }
    finally { state.abort = null; run.disabled = false; if (($("#co-status").textContent || "").includes("coordinating")) $("#co-status").textContent = ""; }
  }
  run.addEventListener("click", runCo);
  autosize(input);
}

// ── view: complete stack (Stage 6) ───────────────────────────────────────
const UNIFIED_SAMPLES = [
  "I'm Ada and I own retrieval-api. Remember that for later.",
  "What does Acme Cloud say about API rate limits on the Pro plan?",
  "Inspect retrieval-api health and explain the diagnostic evidence.",
  "What do you remember about me, my service, and our incident procedure?",
];

function viewUnified() {
  const f = FF_BY_ID.unified;
  setStage(`${ffHeader(f)}
    <div class="u-session-strip">
      <span><i class="dot pulse" id="u-ready-dot"></i><b id="u-ready-label">Preparing MemoRizz session…</b></span>
      <span class="mono" id="u-scope">session ${esc(state.session.slice(0, 10))}</span>
      <span class="mono" id="u-backend">${esc(backendLabel())}</span>
    </div>
    <nav class="u-units" aria-label="Complete stack learning units">
      <button class="u-unit active" data-u-tab="chat"><b>6.1</b>${I.chat}<span>Unified Chat</span></button>
      <button class="u-unit" data-u-tab="cache"><b>6.2</b>${I.cache}<span>Semantic Cache</span></button>
      <button class="u-unit" data-u-tab="summary"><b>6.3</b>${I.stack}<span>Summarization</span></button>
      <button class="u-unit" data-u-tab="compaction"><b>6.4</b>${I.compress}<span>Compaction</span></button>
    </nav>

    <section class="u-unit-panel active" data-u-panel="chat">
      <div class="u-lesson-note">
        <b>One chat, four evidence boundaries.</b> Every turn shows the literal model messages,
        which of MemoRizz's 13 memory partitions contributed, whether the model was skipped by
        semantic cache, and which large results or old turns moved out of the active window.
      </div>
      <div class="u-chat-grid">
        <div class="panel u-chat-panel">
          <div class="panel-head">
            <span class="panel-title">${I.chat} Memo · integrated memory</span>
            <div class="row">
              <button class="btn btn-ghost u-summarize" data-summary-target="summary">${I.compress} Summarize now</button>
              <button class="btn btn-ghost" id="u-new">${I.refresh} New handle</button>
            </div>
          </div>
          <div class="panel-body u-chat-body">
            <div class="u-chat-scroll" id="u-chat-scroll">
              <div class="empty">Use the prompts in order: create a durable entity, retrieve knowledge, call a tool large enough to offload, then test recall.</div>
            </div>
            <div class="chips u-prompt-chips">${UNIFIED_SAMPLES.map((sample, i) => `<button class="chip" data-u-sample="${i}">${i + 1}. ${esc(sample.slice(0, 38))}…</button>`).join("")}</div>
            <div class="u-run-status" id="u-run-status">idle</div>
            <div class="composer">
              <textarea id="u-input" rows="1" placeholder="Ask Memo — every memory decision will be exposed…"></textarea>
              <button class="btn btn-accent" id="u-send">${I.send} Send</button>
            </div>
          </div>
        </div>

        <div class="panel u-evidence-panel">
          <div class="panel-head"><span class="panel-title">${I.window} Turn evidence</span><span class="hint mono" id="u-turn-label">No turn yet</span></div>
          <div class="u-evidence-scroll">
            <div class="u-metrics" id="u-live-metrics"><div class="empty">Loading memory telemetry…</div></div>
            <section class="u-evidence-section">
              <div class="u-section-title"><span>Effective context window</span><em>exact provider input</em></div>
              <div id="u-context-inspector"><div class="empty">Run a turn to inspect every model call and message.</div></div>
            </section>
            <section class="u-evidence-section">
              <div class="u-section-title"><span>Memory types this turn</span><em>stored ≠ injected</em></div>
              <div id="u-memory-inventory"><div class="empty">Memory partitions will appear here.</div></div>
            </section>
            <section class="u-evidence-section">
              <div class="u-section-title"><span>Offloaded & compacted IDs</span><em>progressive disclosure</em></div>
              <div id="u-artifacts"><div class="empty">No summary or tool-log IDs yet.</div></div>
            </section>
          </div>
        </div>
      </div>
    </section>

    <section class="u-unit-panel" data-u-panel="cache">
      <div class="u-unit-intro">
        <div class="u-unit-icon">${I.cache}</div>
        <div><span class="mono">UNIT 6.2 · RESPONSE REUSE</span><h2>Semantic Cache</h2>
        <p>MemoRizz embeds the query and requires matching session, user, prompt, tool schema,
        data version, and request-context fingerprints. Run the same stable request twice: the
        first call writes a response; the second returns it without calling the model.</p></div>
      </div>
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${I.cache} Controlled A/B run</span><span class="hint">same query · same scope · two turns</span></div>
        <div class="panel-body">
          <div class="field"><textarea id="u-cache-query" rows="2">What is the Pro plan API rate limit?</textarea><button class="btn btn-accent" id="u-cache-run">${I.play} Run twice</button></div>
          <div id="u-cache-result" class="u-unit-result"><div class="empty">Run the experiment to compare a cache miss with a proven hit.</div></div>
        </div>
      </div>
    </section>

    <section class="u-unit-panel" data-u-panel="summary">
      <div class="u-unit-intro">
        <div class="u-unit-icon">${I.stack}</div>
        <div><span class="mono">UNIT 6.3 · MEMORY CONSOLIDATION</span><h2>Summarization</h2>
        <p><code>MemAgent.generate_summaries()</code> asks the configured OpenAI model to compress
        unsummarized conversation rows. MemoRizz stores the result in <code>SUMMARIES</code> with its
        own ID, period, count, and exact <code>source_message_ids</code>.</p></div>
      </div>
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${I.stack} Summary registry</span><button class="btn btn-accent u-summarize" data-summary-target="summary">${I.compress} Generate summaries</button></div>
        <div class="panel-body"><div id="u-summary-result" class="u-unit-result"><div class="empty">Create a few chat turns, then generate a real MemoRizz summary.</div></div></div>
      </div>
    </section>

    <section class="u-unit-panel" data-u-panel="compaction">
      <div class="u-unit-intro">
        <div class="u-unit-icon">${I.compress}</div>
        <div><span class="mono">UNIT 6.4 · CONTEXT CONTROL</span><h2>Compaction</h2>
        <p>Compaction is the boundary after summarization: source rows remain durable and auditable,
        but their new <code>summary_id</code> links let MemoRizz exclude them from active conversation
        history and inject the much smaller summary reference instead.</p></div>
      </div>
      <div class="panel">
        <div class="panel-head"><span class="panel-title">${I.compress} Before → summary → active window</span><button class="btn btn-accent u-summarize" data-summary-target="compaction">${I.compress} Summarize & compact</button></div>
        <div class="panel-body">
          <div id="u-compaction-result" class="u-unit-result"><div class="empty">Compacted source-message links and context effects appear here.</div></div>
          <div id="u-compaction-map" class="u-compaction-map"></div>
        </div>
      </div>
    </section>`, f.accent);
  $(".view").classList.add("wide", "unified-view");

  $$(".u-unit").forEach((button) => button.addEventListener("click", () => activateUnifiedUnit(button.dataset.uTab)));
  const input = $("#u-input"), send = $("#u-send"), scroll = $("#u-chat-scroll");
  $$("[data-u-sample]").forEach((button) => button.addEventListener("click", () => {
    input.value = UNIFIED_SAMPLES[Number(button.dataset.uSample)]; autosize(input); input.focus();
  }));

  async function sendMessage() {
    const message = input.value.trim(); if (!message || state.abort) return;
    addMsg(scroll, "user", message); input.value = ""; autosize(input);
    const bubble = addMsg(scroll, "bot", ""); bubble.innerHTML = '<span class="caret"></span>';
    send.disabled = true; let acc = ""; state.abort = new AbortController();
    try {
      await streamSSE("/api/unified/message", { session_id: state.session, message }, (ev) => {
        if (ev.type === "phase") $("#u-run-status").textContent = ev.label || ev.phase;
        else if (ev.type === "delta") { acc += ev.text; bubble.innerHTML = renderRich(acc) + '<span class="caret"></span>'; scroll.scrollTop = scroll.scrollHeight; }
        else if (ev.type === "snapshot") { state.unifiedSnapshot = ev.snapshot; renderUnifiedSnapshot(ev.snapshot); }
        else if (ev.type === "final") { bubble.innerHTML = renderRich(acc || ev.reply || ""); $("#u-run-status").textContent = "turn complete · evidence captured"; }
        else if (ev.type === "error") { bubble.innerHTML = `<span style="color:var(--r5)">${esc(ev.message)}</span>`; }
      }, state.abort.signal);
    } catch (error) { bubble.innerHTML = `<span style="color:var(--r5)">Error: ${esc(error.message)}</span>`; }
    finally { state.abort = null; send.disabled = false; input.focus(); }
  }
  send.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
  input.addEventListener("input", () => autosize(input));
  $("#u-cache-run").addEventListener("click", runUnifiedCacheLab);
  $$(".u-summarize").forEach((button) => button.addEventListener("click", () => runUnifiedSummaries(button.dataset.summaryTarget)));
  $("#u-new").addEventListener("click", async () => {
    cancelStream(); await postJSON("/api/unified/reset", { session_id: state.session }).catch(() => {});
    state.session = uid(); state.unifiedSnapshot = null; viewUnified();
  });
  activateUnifiedUnit(state.unifiedUnit || "chat");
  loadUnifiedState();
}

function activateUnifiedUnit(unit) {
  state.unifiedUnit = unit;
  $$(".u-unit").forEach((button) => button.classList.toggle("active", button.dataset.uTab === unit));
  $$(".u-unit-panel").forEach((panel) => panel.classList.toggle("active", panel.dataset.uPanel === unit));
}

async function loadUnifiedState() {
  try {
    const data = await getJSON(`/api/unified/state?session_id=${encodeURIComponent(state.session)}`);
    if (!data.ready) throw new Error(data.message || "Memory session is not ready");
    state.unifiedSnapshot = data.snapshot; renderUnifiedSnapshot(data.snapshot);
    const dot = $("#u-ready-dot"); if (dot) dot.className = "dot ok";
    if ($("#u-ready-label")) $("#u-ready-label").textContent = "MemoRizz session ready";
  } catch (error) {
    const dot = $("#u-ready-dot"); if (dot) dot.className = "dot warn";
    if ($("#u-ready-label")) $("#u-ready-label").textContent = `Setup failed · ${error.message}`;
  }
}

function unifiedMetric(label, value, tone = "") {
  return `<div class="u-metric ${tone}"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
}

function prettyJSON(value) {
  try { return JSON.stringify(value, null, 2); } catch (_) { return String(value ?? ""); }
}

function renderExactCall(call, index, total) {
  const messages = call.messages || [], tools = call.tools || [];
  const messageHTML = messages.map((message, messageIndex) => `
    <div class="u-exact-message role-${esc(message.role || "unknown")}">
      <div class="u-exact-head"><span>${esc(message.role || "message")}</span><em>message ${messageIndex + 1}</em></div>
      <pre>${esc(typeof message.content === "string" ? message.content : prettyJSON(message.content))}</pre>
      ${message.tool_calls ? `<details><summary>Tool calls</summary><pre>${esc(prettyJSON(message.tool_calls))}</pre></details>` : ""}
    </div>`).join("");
  return `<details class="u-model-call" ${index === total - 1 ? "open" : ""}>
    <summary><span>Model call ${index + 1}</span><em>${messages.length} messages · ${tools.length} tool schemas</em></summary>
    <div class="u-call-body">${messageHTML}
      <div class="u-exact-message role-tools"><div class="u-exact-head"><span>tools parameter</span><em>exact schemas</em></div><pre>${esc(prettyJSON(tools))}</pre></div>
    </div>
  </details>`;
}

function renderMemoryType(memory) {
  const statusClass = /in context|served|pointer|active|captured/.test(memory.status || "") ? "hot" : "";
  return `<details class="u-memory-card ${statusClass}">
    <summary><span class="u-memory-name"><i></i>${esc(memory.label)}</span><span class="u-memory-status">${esc(memory.status)}</span><b>${Number(memory.count || 0)}</b></summary>
    <div class="u-memory-body"><p>${esc(memory.description || "")}</p><pre>${esc(prettyJSON(memory.items || []))}</pre></div>
  </details>`;
}

function idChips(values, emptyLabel) {
  const list = (values || []).filter(Boolean);
  if (!list.length) return `<span class="muted">${esc(emptyLabel)}</span>`;
  return `<div class="u-id-list">${list.map((value) => `<code title="${esc(value)}">${esc(String(value))}</code>`).join("")}</div>`;
}

function renderUnifiedSnapshot(snapshot) {
  if (!snapshot || !$("#u-live-metrics")) return;
  const context = snapshot.context || {}, cache = snapshot.cache || {}, stats = context.window_stats || {};
  const calls = context.calls || [], prompt = stats.prompt_tokens || stats.total_tokens || 0;
  $("#u-turn-label").textContent = snapshot.turn ? `turn ${snapshot.turn}` : "session initialized";
  $("#u-scope").textContent = `${snapshot.scope?.memory_id || "memory scope"} · ${snapshot.scope?.thread_id || "thread"}`;
  $("#u-backend").textContent = snapshot.backend === "oracle" ? "Oracle AI Database" : snapshot.backend || "memory provider";
  $("#u-live-metrics").innerHTML = [
    unifiedMetric("Cache", cache.hit ? "HIT" : (calls.length ? "MISS" : "IDLE"), cache.hit ? "good" : ""),
    unifiedMetric("Model calls", String(context.model_call_count || 0), context.model_called ? "" : cache.hit ? "good" : ""),
    unifiedMetric("Prompt tokens", Number(prompt).toLocaleString()),
    unifiedMetric("Memory types", `${(snapshot.memory_types || []).length} active`),
  ].join("");

  const exact = $("#u-context-inspector");
  if (cache.hit && !context.model_called) {
    exact.innerHTML = `<div class="u-cache-skip">${I.check}<div><b>Model call skipped</b><p>MemoRizz served this turn from semantic cache. There is no fabricated prompt to show because no provider request was made.</p></div></div>`;
  } else if (!calls.length) {
    exact.innerHTML = `<div class="empty">No model call has been captured yet.</div>`;
  } else {
    const windowSize = Number(stats.context_window_tokens || 128000), used = Number(prompt || 0), pct = Math.min(100, used / windowSize * 100);
    exact.innerHTML = `<div class="u-window-readout"><span><b>${used.toLocaleString()}</b> / ${windowSize.toLocaleString()} tokens</span><em>${pct.toFixed(2)}%</em></div>
      <div class="u-window-track"><i style="width:${pct}%"></i></div>
      <p class="hint">Each expandable call below is the exact <code>messages</code> and <code>tools</code> payload captured at the model boundary. Tool loops produce more than one call.</p>
      ${calls.map((call, index) => renderExactCall(call, index, calls.length)).join("")}`;
  }
  $("#u-memory-inventory").innerHTML = (snapshot.memory_types || []).map(renderMemoryType).join("") || `<div class="empty">No memory inventory.</div>`;
  $("#u-artifacts").innerHTML = `
    <div class="u-artifact"><span>Summary IDs</span>${idChips(snapshot.summary_ids, "No summaries yet")}</div>
    <div class="u-artifact"><span>Compacted source IDs</span>${idChips(snapshot.compacted_source_ids, "No source messages compacted")}</div>
    <div class="u-artifact"><span>Offloaded tool-log IDs</span>${idChips(snapshot.offloaded_tool_log_ids, "No large tool results offloaded")}</div>
    <div class="u-cache-line"><b>semantic cache</b><span>${Number(cache.hits || 0)} hits · ${Number(cache.misses || 0)} misses · ${Number(cache.writes || 0)} writes · ${Number(cache.size || 0)} entries</span></div>`;
  renderSummaryRegistry(snapshot);
  renderCompactionMap(snapshot);
}

async function runUnifiedCacheLab() {
  const button = $("#u-cache-run"), box = $("#u-cache-result"), query = $("#u-cache-query").value.trim();
  if (!query || button.disabled) return;
  button.disabled = true; box.innerHTML = `<div class="empty"><span class="spinner" style="display:inline-block"></span> running the miss, then the identical lookup…</div>`;
  try {
    const data = await postJSON("/api/unified/cache/run", { session_id: state.session, query });
    if (!data.ok) throw new Error(data.message || "Cache experiment failed");
    const first = data.first?.snapshot || {}, second = data.second?.snapshot || {}, proof = data.proof || {};
    const inspection = second.cache?.inspection || {};
    box.innerHTML = `<div class="u-proof-grid">
      <div class="u-proof miss"><span>First turn</span><b>MISS</b><p>${proof.first_model_called ? "Model called and response written" : "No model call captured"}</p></div>
      <div class="u-proof-arrow">→</div>
      <div class="u-proof hit"><span>Second turn</span><b>${proof.second_cache_hit ? "HIT" : "MISS"}</b><p>${proof.second_model_called ? "Model called again" : "Model skipped — cached response served"}</p></div>
    </div>
    <div class="u-cache-comparison"><div><span>First answer</span>${renderRich(data.first?.reply || "")}</div><div><span>Second answer</span>${renderRich(data.second?.reply || "")}</div></div>
    <details class="u-json-proof" open><summary>Cache-match evidence</summary><pre>${esc(prettyJSON(inspection))}</pre></details>`;
    state.unifiedSnapshot = second; renderUnifiedSnapshot(second);
  } catch (error) { box.innerHTML = `<div class="banner warn">${I.alert}<div>${esc(error.message)}</div></div>`; }
  finally { button.disabled = false; }
}

async function runUnifiedSummaries(target = "summary") {
  const buttons = $$(".u-summarize"); buttons.forEach((button) => button.disabled = true);
  const statusBoxes = [$("#u-summary-result"), $("#u-compaction-result")].filter(Boolean);
  statusBoxes.forEach((box) => box.innerHTML = `<div class="empty"><span class="spinner" style="display:inline-block"></span> MemoRizz is summarizing scoped conversation rows…</div>`);
  try {
    const data = await postJSON("/api/unified/summarize", { session_id: state.session });
    if (!data.ok) throw new Error(data.message || "Summary generation failed");
    state.unifiedSnapshot = data.snapshot; renderUnifiedSnapshot(data.snapshot);
    const created = data.created_summary_ids || [];
    const outcomeHTML = `<div class="u-summary-outcome ${created.length ? "created" : "idle"}">
      <b>${created.length ? `${created.length} summary record${created.length === 1 ? "" : "s"} created` : "Nothing new to summarize"}</b>
      <p>${created.length ? `${data.compacted_count} source messages were linked atomically.` : "All eligible rows in this scoped thread already have summary links."}</p>
      ${idChips(created, "No new summary IDs")}</div>`;
    renderSummaryRegistry(data.snapshot, outcomeHTML);
    $("#u-compaction-result").innerHTML = `<div class="u-before-after">
      <div><span>Before</span><b>${Number(data.before?.unsummarized || 0)}</b><em>unsummarized rows</em></div>
      <i>${I.arrow}</i>
      <div><span>After</span><b>${Number(data.after?.unsummarized || 0)}</b><em>unsummarized rows</em></div>
      <i>${I.arrow}</i>
      <div class="hot"><span>Compacted</span><b>${Number(data.compacted_count || 0)}</b><em>source links</em></div>
    </div>`;
    activateUnifiedUnit(target);
  } catch (error) { statusBoxes.forEach((box) => box.innerHTML = `<div class="banner warn">${I.alert}<div>${esc(error.message)}</div></div>`); }
  finally { buttons.forEach((button) => button.disabled = false); }
}

function renderSummaryRegistry(snapshot, prefixHTML = "") {
  const box = $("#u-summary-result"); if (!box) return;
  if (!prefixHTML && box.querySelector(".spinner")) return;
  const summaries = snapshot.summaries || [];
  if (!summaries.length) { box.innerHTML = prefixHTML || `<div class="empty">No summaries yet. Chat first, then generate one.</div>`; return; }
  box.innerHTML = `${prefixHTML}<div class="u-summary-list">${summaries.map((summary) => `
    <details class="u-summary-record"><summary><span>${esc(summary.summary_id || "summary")}</span><b>${Number(summary.memory_units_count || (summary.source_message_ids || []).length)} sources</b></summary>
      <div><p>${esc(summary.content || "")}</p><span class="mono">source_message_ids</span>${idChips(summary.source_message_ids, "No source IDs")}</div>
    </details>`).join("")}</div>`;
}

function renderCompactionMap(snapshot) {
  const box = $("#u-compaction-map"); if (!box) return;
  const sourceIds = snapshot.compacted_source_ids || [], summaryIds = snapshot.summary_ids || [];
  if (!summaryIds.length) { box.innerHTML = `<div class="empty">The source → summary → context map appears after summarization.</div>`; return; }
  box.innerHTML = `<div class="u-compact-flow">
    <div><span>Durable source rows</span><b>${sourceIds.length}</b><small>preserved in CONVERSATION_MEMORY</small>${idChips(sourceIds.slice(0, 8), "—")}</div>
    <i>${I.arrow}</i>
    <div class="hot"><span>Summary registry</span><b>${summaryIds.length}</b><small>source-linked SUMMARIES rows</small>${idChips(summaryIds, "—")}</div>
    <i>${I.arrow}</i>
    <div><span>Effective context</span><b>smaller</b><small>summary references replace linked turns</small></div>
  </div>`;
}

// ── agent log (kept for completeness) ────────────────────────────────────
function addEvent(log, ev) {
  if (log.querySelector(".empty")) log.innerHTML = "";
  const node = document.createElement("div");
  if (ev.type === "delta" || ev.type === "text") {
    node.className = "ev text"; node.innerHTML = `<div class="ev-icon">${I.bot}</div><div class="ev-text"><div class="ev-bubble">${renderRich(ev.text || "")}</div></div>`;
  } else if (ev.type === "error") {
    node.className = "ev err"; node.innerHTML = `<div class="ev-icon">${I.alert}</div><div class="ev-text"><div class="ev-bubble">${esc(ev.message)}</div></div>`;
  } else return null;
  log.appendChild(node); log.scrollTop = log.scrollHeight; return node;
}

// ── context window rail (right side, every page) ─────────────────────────
const CTX_COLORS = {
  system: "#8b8f98", persona: "var(--r2)", history: "var(--r1)", entity: "var(--r3)",
  knowledge: "var(--r4)", summary: "#a78bfa", tools: "var(--r5)", shared: "#22d3ee",
  query: "#10b981", extra: "#94a3b8",
};
const ctxColor = (k) => CTX_COLORS[k] || "#94a3b8";

// shared renderers so the main rail AND the per-agent coordination view show
// identical segmented bars + expandable content rows.
function ctxBarHTML(segs, win) {
  return segs.map((s) =>
    `<span class="ctx-seg" title="${esc(s.label)} · ${s.tokens} tok" style="width:${((s.tokens / win) * 100).toFixed(2)}%;background:${ctxColor(s.kind)}"></span>`).join("");
}
function ctxLegendHTML(segs, prefix) {
  return segs.map((s, i) => {
    const preview = s.preview != null ? String(s.preview) : "";
    const trunc = s.truncated
      ? `<div class="ctx-trunc">showing ${preview.length.toLocaleString()} of ${(s.chars || preview.length).toLocaleString()} chars in this segment</div>`
      : "";
    const body = preview ? esc(preview) : '<span class="muted">(no text content)</span>';
    return `<div class="ctx-leg-item">
      <button class="ctx-leg" data-c="${prefix}-${i}" type="button" title="Click to view contents">
        <span class="sw" style="background:${ctxColor(s.kind)}"></span>
        <span class="nm">${esc(s.label)}</span>
        <span class="tk">${s.tokens.toLocaleString()}</span>
        <span class="cx-caret">${I.arrow}</span>
      </button>
      <div class="ctx-content" id="${prefix}-${i}" hidden><pre>${body}</pre>${trunc}</div>
    </div>`;
  }).join("");
}
function attachCtxToggles(root) {
  $$(".ctx-leg", root).forEach((b) => b.addEventListener("click", () => {
    const c = document.getElementById(b.dataset.c); if (!c) return;
    if (c.hasAttribute("hidden")) { c.removeAttribute("hidden"); b.classList.add("open"); }
    else { c.setAttribute("hidden", ""); b.classList.remove("open"); }
  }));
}

function renderCtxRail() {
  const el = $("#ctxrail"); if (!el) return;
  if (state.route === "coordination") { renderCoordRail(); return; }
  el.innerHTML = `
    <div class="ctx-title">${I.stack} Context Window</div>
    <div class="ctx-readout"><span class="ctx-pct" id="ctx-pct">0<span class="lbl">%</span></span></div>
    <div class="ctx-sub" id="ctx-sub">idle — run a turn to watch it fill</div>
    <div class="ctx-bar" id="ctx-bar"></div>
    <div class="ctx-legend" id="ctx-legend"><div class="ctx-empty">As the agent assembles each turn, the memory packed into its prompt appears here in real time — persona, conversation, entities, knowledge, tools, and your query.</div></div>
    <div class="ctx-foot">Estimates of what fills the model's context window per turn; the final value reconciles to the agent's reported token usage.</div>`;
}

function resetCtxRail() {
  if (state.route === "coordination") { renderCoordRail(); return; }
  const sub = $("#ctx-sub"), leg = $("#ctx-legend"), bar = $("#ctx-bar"), pct = $("#ctx-pct");
  if (!sub) return;
  sub.textContent = "assembling context…";
  if (leg) leg.innerHTML = `<div class="ctx-empty">assembling…</div>`;
  if (bar) bar.innerHTML = "";
  if (pct) pct.innerHTML = `0<span class="lbl">%</span>`;
}

function updateCtxRail(ev) {
  const bar = $("#ctx-bar"), leg = $("#ctx-legend"), pct = $("#ctx-pct"), sub = $("#ctx-sub");
  if (!bar) return;
  const win = ev.window || 1, used = ev.used || 0, segs = ev.segments || [];
  const p = Math.min(100, (used / win) * 100);
  pct.innerHTML = (p < 1 ? p.toFixed(2) : p.toFixed(1)) + `<span class="lbl">% of ${Math.round(win / 1000)}k</span>`;
  sub.textContent = `${used.toLocaleString()} / ${win.toLocaleString()} tokens` + (ev.stage === "prefill" ? " · filling…" : " · packed");
  bar.innerHTML = ctxBarHTML(segs, win);
  if (!segs.length) { leg.innerHTML = `<div class="ctx-empty">—</div>`; return; }
  leg.innerHTML = ctxLegendHTML(segs, "ctxc");
  attachCtxToggles(leg);
}

// ── coordination agent-flow rail (memory layer 5) ────────────────────────
const COORD_POS = { lead: [50, 16], researcher: [21, 52], reviewer: [79, 52], output: [50, 90] };
const COORD_LABEL = { lead: "Lead", researcher: "Researcher", reviewer: "Reviewer", output: "Recommendation" };
let coordCtx = {};
const _coordSeen = {};
function _coordSeenReset() { for (const k in _coordSeen) delete _coordSeen[k]; }

function renderCoordRail() {
  const el = $("#ctxrail"); if (!el) return;
  coordSelected = null;
  el.innerHTML = `
    <div class="ctx-title">${I.agent} Agentic Flow</div>
    <div class="cflow" id="cflow"><div class="ctx-empty" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 14px">Run the team to watch the Lead delegate to specialists in real time. Click an agent to inspect its context window.</div></div>
    <div id="coord-ctx" class="coord-ctx"><div class="ctx-empty">Click an agent above to inspect its full context window — segment by segment, with contents.</div></div>
    <div class="ctx-title" style="margin-top:4px">Live transcript</div>
    <div class="ctranscript" id="ctranscript"><div class="ctx-empty">Instructions and reports stream here as agents hand off work over the shared blackboard.</div></div>
    <div class="ctx-foot">A Lead agent delegates to a Researcher and a Reviewer over shared memory, then synthesizes — the same pattern as memorizz's MultiAgentOrchestrator, shown step by step.</div>`;
}

function drawCoordGraph(arch) {
  const wrap = $("#cflow"); if (!wrap) return;
  coordCtx = {};
  const drawn = {}; let lines = "";
  (arch.edges || []).forEach((e) => {
    const other = e.src === "lead" ? e.dst : e.src; const key = "lead-" + other;
    if (drawn[key]) return; drawn[key] = 1;
    const a = COORD_POS.lead, b = COORD_POS[other]; if (!a || !b) return;
    lines += `<line id="edge-${key}" class="cedge" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"></line>`;
  });
  const nodes = (arch.agents || []).map((a) => {
    const p = COORD_POS[a.id]; if (!p) return "";
    return `<div class="cnode ${a.role === "output" ? "output" : ""}" id="node-${a.id}" data-agent="${a.id}" title="${esc(a.desc || "")}" style="left:${p[0]}%;top:${p[1]}%"><div class="chip"><span class="role-dot"></span>${esc(a.name)}</div><div class="role">${esc(a.role)}</div></div>`;
  }).join("");
  wrap.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${nodes}`;
  $$(".cnode", wrap).forEach((n) => {
    n.addEventListener("click", () => showAgentContext(n.dataset.agent));
  });
  coordSelected = null;
  const cc = $("#coord-ctx"); if (cc) cc.innerHTML = `<div class="ctx-empty">Click an agent above to inspect its full context window.</div>`;
  const t = $("#ctranscript"); if (t) t.innerHTML = `<div class="ctx-empty">delegating…</div>`;
}

function handleCoordEvent(ev) {
  if (ev.type === "architecture") { _coordSeenReset(); drawCoordGraph(ev); return; }
  if (ev.type === "agent_context") {
    coordCtx[ev.agent] = ev;
    if (coordSelected === ev.agent) showAgentContext(ev.agent);  // live-refresh the open panel
    return;
  }
  if (ev.type !== "flow") return;
  const other = ev.src === "lead" ? ev.dst : ev.src;
  const edge = $("#edge-lead-" + other);
  $$(".cnode").forEach((n) => n.classList.remove("busy"));
  if (ev.status === "active") {
    if (edge) edge.classList.add("active");
    const dst = $("#node-" + ev.dst); if (dst) dst.classList.add("busy");
  } else if (edge) { edge.classList.remove("active"); edge.classList.add("done"); }
  const showIt = (ev.kind === "instruction" && ev.status === "active") || (ev.kind !== "instruction" && ev.status === "done");
  const seenKey = ev.id + ":" + ev.status;
  if (showIt && ev.content && !_coordSeen[seenKey]) {
    _coordSeen[seenKey] = 1;
    const log = $("#ctranscript"); if (!log) return;
    if (log.querySelector(".ctx-empty")) log.innerHTML = "";
    const div = document.createElement("div");
    div.className = "cmsg kind-" + ev.kind;
    const dstLabel = COORD_LABEL[ev.dst] || ev.dst;
    div.innerHTML = `<div class="hd">${esc(COORD_LABEL[ev.src] || ev.src)} <span class="arrow">→</span> ${esc(dstLabel)} <span style="margin-left:auto">${esc(ev.kind)}</span></div><div class="bd">${renderRich(String(ev.content).slice(0, 280))}</div>`;
    log.appendChild(div); log.scrollTop = log.scrollHeight;
  }
}

let coordSelected = null;
function showAgentContext(agentId) {
  coordSelected = agentId;
  $$(".cnode").forEach((n) => n.classList.toggle("sel", n.dataset.agent === agentId));
  const box = $("#coord-ctx"); if (!box) return;
  const ctx = coordCtx[agentId];
  const label = COORD_LABEL[agentId] || agentId;
  if (!ctx || !ctx.window) {
    box.innerHTML = `<div class="ctx-title" style="margin-top:6px">${I.stack} Context · ${esc(label)}</div><div class="ctx-empty">No context captured yet — run the team, then click ${esc(label)}.</div>`;
    return;
  }
  const segs = ctx.segments || [], win = ctx.window || 1, used = ctx.used || 0;
  const p = Math.min(100, (used / win) * 100);
  box.innerHTML = `
    <div class="ctx-title" style="margin-top:6px">${I.stack} Context · ${esc(label)}</div>
    <div class="ctx-sub">${used.toLocaleString()} / ${win.toLocaleString()} tokens · ${p.toFixed(1)}% · click a row to read its contents</div>
    <div class="ctx-bar">${ctxBarHTML(segs, win)}</div>
    <div class="ctx-legend">${ctxLegendHTML(segs, "coordctx")}</div>`;
  attachCtxToggles(box);
}

// ── persistent Data Explorer ─────────────────────────────────────────
async function explorerJSON(url) {
  const response = await fetch(url);
  let payload = {};
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
  return payload;
}

function toggleExplorer(force) {
  const explorer = $("#data-explorer");
  const opening = force ?? !explorer.classList.contains("open");
  explorer.classList.toggle("open", opening);
  $("#explorer-body").hidden = !opening;
  $("#explorer-toggle").setAttribute("aria-expanded", String(opening));
  document.body.classList.toggle("explorer-open", opening);
  if (opening && !explorerState.tables.length) loadExplorerCatalog();
}

function initializeExplorerResize(storageKey) {
  const explorer = $("#data-explorer");
  const handle = $("#explorer-resizer");
  const saved = Number(localStorage.getItem(storageKey));
  if (Number.isFinite(saved) && saved >= 220) {
    document.documentElement.style.setProperty("--explorer-height", `${Math.min(saved, window.innerHeight - 80)}px`);
  }
  handle.addEventListener("pointerdown", (event) => {
    if (!explorer.classList.contains("open")) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    const startY = event.clientY;
    const startHeight = explorer.getBoundingClientRect().height;
    explorer.classList.add("resizing");
    document.body.classList.add("explorer-resizing");
    const move = (moveEvent) => {
      const next = Math.max(220, Math.min(window.innerHeight - 80, startHeight + startY - moveEvent.clientY));
      document.documentElement.style.setProperty("--explorer-height", `${Math.round(next)}px`);
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
      explorer.classList.remove("resizing");
      document.body.classList.remove("explorer-resizing");
      localStorage.setItem(storageKey, String(Math.round(explorer.getBoundingClientRect().height)));
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  });
}

async function loadExplorerCatalog() {
  const refresh = $("#explorer-refresh");
  refresh.disabled = true;
  try {
    const payload = await explorerJSON("/api/data_explorer/tables");
    explorerState.tables = payload.tables || [];
    const totalRows = explorerState.tables.reduce((total, table) => total + Math.max(0, table.row_count), 0);
    const summary =
      `${explorerState.tables.length} tables · ${totalRows.toLocaleString()} rows · ${payload.backend}${payload.schema ? ` · ${payload.schema}` : ""}`;
    $("#explorer-summary").textContent = summary;
    const homeSummary = $("#home-explorer-summary");
    if (homeSummary) homeSummary.textContent = summary;
    renderExplorerTables();
    const stillAvailable = explorerState.tables.some((table) => table.name === explorerState.selected);
    if (!stillAvailable) {
      const preferred = explorerState.tables.find((table) => table.name.toLowerCase() === explorerState.preferredTable);
      const firstPopulated = explorerState.tables.find((table) => table.row_count > 0);
      const initial = (preferred?.row_count > 0 ? preferred : null) || firstPopulated || preferred || explorerState.tables[0];
      if (initial) await selectExplorerTable(initial.name);
    }
  } catch (error) {
    $("#explorer-summary").textContent = error.message;
    const homeSummary = $("#home-explorer-summary");
    if (homeSummary) homeSummary.textContent = error.message;
    $("#explorer-grid").innerHTML = `<div class="explorer-error">${esc(error.message)}</div>`;
  } finally {
    refresh.disabled = false;
  }
}

function renderExplorerTables() {
  const filter = ($("#explorer-filter").value || "").toLowerCase();
  const visible = explorerState.tables.filter((table) =>
    !filter || `${table.name} ${table.layer}`.toLowerCase().includes(filter)
  );
  $("#explorer-table-list").innerHTML = visible.map((table) => {
    const key = table.name.toLowerCase();
    const event = explorerState.active.get(key);
    const recent = explorerState.recent.get(key);
    const pulse = event ? `tx-${event.operation.toLowerCase()}` : recent ? `flash-${recent.operation.toLowerCase()}` : "";
    return `<button class="explorer-table-item ${explorerState.selected === table.name ? "selected" : ""} ${pulse}" data-explorer-table="${esc(table.name)}">
      <span><i></i>${esc(table.name)}</span><b>${table.row_count < 0 ? "—" : Number(table.row_count).toLocaleString()}</b>
      ${event ? `<em>${esc(event.operation)}</em>` : ""}
    </button>`;
  }).join("") || '<div class="explorer-empty">No matching tables.</div>';
  $("#explorer-table-list").querySelectorAll("[data-explorer-table]").forEach((button) => {
    button.addEventListener("click", () => selectExplorerTable(button.dataset.explorerTable));
  });
}

async function selectExplorerTable(name, offset = 0) {
  explorerState.selected = name;
  explorerState.offset = offset;
  renderExplorerTables();
  $("#explorer-grid").innerHTML = '<div class="explorer-empty">Reading rows…</div>';
  try {
    explorerState.result = await explorerJSON(
      `/api/data_explorer/tables/${encodeURIComponent(name)}/rows?limit=${explorerState.limit}&offset=${offset}`
    );
    renderExplorerRows();
  } catch (error) {
    $("#explorer-grid").innerHTML = `<div class="explorer-error">${esc(error.message)}</div>`;
  }
}

function explorerCellText(value) {
  if (value === null || value === undefined) return "";
  const rendered = typeof value === "object" ? JSON.stringify(value) : String(value);
  return rendered.length > 220 ? rendered.slice(0, 220) + "…" : rendered;
}

function formatExplorerCell(value) {
  if (value === null || value === undefined) return '<span class="explorer-null">NULL</span>';
  return esc(explorerCellText(value));
}

function renderExplorerRows() {
  const data = explorerState.result;
  if (!data) return;
  const table = explorerState.tables.find((item) => item.name.toLowerCase() === data.table.toLowerCase());
  $("#explorer-layer").textContent = `${table?.layer || "database"} · ${data.columns.length} columns`;
  $("#explorer-table-name").textContent = data.table;
  const knownTotal = data.row_count >= 0;
  const start = data.rows.length ? data.offset + 1 : 0;
  const end = data.offset + data.rows.length;
  $("#explorer-page").textContent = knownTotal
    ? `${start.toLocaleString()}–${end.toLocaleString()} of ${Number(data.row_count).toLocaleString()}`
    : `${start.toLocaleString()}–${end.toLocaleString()}`;
  $("#explorer-prev").disabled = data.offset === 0;
  $("#explorer-next").disabled = knownTotal ? end >= data.row_count : data.rows.length < data.limit;

  if (!data.columns.length) {
    $("#explorer-grid").innerHTML = '<div class="explorer-empty">This table has no discoverable columns.</div>';
    return;
  }
  const key = data.table.toLowerCase();
  const event = explorerState.active.get(key);
  const recent = explorerState.recent.get(key);
  const pulse = event || recent;
  const prefix = event ? "tx" : "flash";
  const pulseClass = pulse ? `${prefix}-${pulse.operation.toLowerCase()}` : "";
  const head = data.columns.map((column) =>
    `<th><span>${esc(column.name)}</span><small>${esc(column.type)}${column.primary_key ? " · PK" : ""}</small></th>`
  ).join("");
  const body = data.rows.map((row, index) => {
    const rowPulse = pulse && (!pulse.row_key || pulse.row_key === data.row_keys[index]) ? pulseClass : "";
    const cells = data.columns.map((column) => {
      const text = explorerCellText(row[column.name]);
      return `<td title="${esc(text)}">${formatExplorerCell(row[column.name])}</td>`;
    }).join("");
    return `<tr class="${rowPulse}" data-row-key="${esc(data.row_keys[index])}">${cells}</tr>`;
  }).join("");
  $("#explorer-grid").innerHTML = data.rows.length
    ? `<table class="explorer-data-table ${pulseClass}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
    : '<div class="explorer-empty">The table is currently empty.</div>';
}

function onExplorerTransaction(event) {
  explorerState.events.unshift(event);
  explorerState.events = explorerState.events.slice(0, 40);
  const table = event.table.toLowerCase();
  if (event.status === "active") {
    explorerState.active.set(table, event);
  } else {
    if (explorerState.active.get(table)?.transaction_id === event.transaction_id) explorerState.active.delete(table);
    explorerState.recent.set(table, event);
    setTimeout(() => {
      if (explorerState.recent.get(table)?.transaction_id === event.transaction_id) {
        explorerState.recent.delete(table);
        renderExplorerTables();
        if (explorerState.result?.table.toLowerCase() === table) renderExplorerRows();
      }
    }, 1400);
    if (event.status === "committed" && event.operation === "WRITE") {
      clearTimeout(explorerState.refreshTimer);
      explorerState.refreshTimer = setTimeout(async () => {
        const selected = explorerState.selected;
        await loadExplorerCatalog();
        if (selected && selected.toLowerCase() === table) await selectExplorerTable(selected, 0);
      }, 250);
    }
  }
  const latest = [...explorerState.active.values()].at(-1);
  $("#explorer-live-label").textContent = latest ? `${latest.operation} · ${latest.table}` : "Live transactions";
  $("#data-explorer").classList.toggle("transacting", explorerState.active.size > 0);
  renderExplorerTables();
  if (explorerState.result?.table.toLowerCase() === table) renderExplorerRows();
  renderExplorerActivity();
}

function renderExplorerActivity() {
  $("#explorer-activity-list").innerHTML = explorerState.events.map((event) =>
    `<div class="explorer-activity-event ${event.status} ${event.operation.toLowerCase()}"><i></i><div>
      <strong>${esc(event.operation)} <span>${esc(event.table)}</span> <em>${esc(event.status.replace("_", " "))}</em></strong>
      <small>${esc(event.route)} · ${esc(event.detail || event.status)}</small>
    </div><time>${new Date(event.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></div>`
  ).join("") || '<div class="explorer-empty">Waiting for database activity…</div>';
}

function connectExplorerActivity() {
  if (explorerState.source) explorerState.source.close();
  const source = new EventSource("/api/data_explorer/activity");
  explorerState.source = source;
  source.addEventListener("transaction", (event) => {
    try { onExplorerTransaction(JSON.parse(event.data)); } catch (_) {}
  });
  source.addEventListener("ready", () => { $("#explorer-live-label").textContent = "Live transactions"; });
  source.onerror = () => { $("#explorer-live-label").textContent = "Reconnecting…"; };
}

async function loadRecentExplorerActivity() {
  try {
    const payload = await explorerJSON("/api/data_explorer/activity/recent");
    explorerState.events = payload.events || [];
    renderExplorerActivity();
  } catch (_) {}
}

function initializeDataExplorer(storageKey) {
  $("#explorer-toggle").addEventListener("click", () => toggleExplorer());
  $("#explorer-refresh").addEventListener("click", loadExplorerCatalog);
  $("#explorer-filter").addEventListener("input", renderExplorerTables);
  $("#explorer-prev").addEventListener("click", () =>
    selectExplorerTable(explorerState.selected, Math.max(0, explorerState.offset - explorerState.limit))
  );
  $("#explorer-next").addEventListener("click", () =>
    selectExplorerTable(explorerState.selected, explorerState.offset + explorerState.limit)
  );
  initializeExplorerResize(storageKey);
  connectExplorerActivity();
  loadRecentExplorerActivity();
  loadExplorerCatalog();
}

// ── router ───────────────────────────────────────────────────────────
const ROUTES = {
  "": viewHome, conversation: viewConversation, semantic: viewSemantic,
  knowledge: viewKnowledge, procedural: viewProcedural, coordination: viewCoordination,
  unified: viewUnified,
};
function route() {
  cancelStream();
  const id = (location.hash.replace(/^#\/?/, "").trim()) || "";
  state.route = id;
  const render = ROUTES[id] || viewHome;
  renderSidebar(id || "home");
  renderCtxRail();
  render();
  if (window.innerWidth <= 760) closeMenu();
}

// ── mobile menu ──────────────────────────────────────────────────────
function openMenu() { $("#sidebar").classList.add("open"); const s = $("#scrim"); s.hidden = false; }
function closeMenu() { $("#sidebar").classList.remove("open"); $("#scrim").hidden = true; }

// ── boot ─────────────────────────────────────────────────────────────
async function boot() {
  const mb = document.createElement("button");
  mb.className = "menu-btn"; mb.innerHTML = I.menu; mb.setAttribute("aria-label", "Menu");
  mb.addEventListener("click", openMenu); document.body.appendChild(mb);
  $("#scrim").addEventListener("click", closeMenu);

  window.addEventListener("hashchange", route);
  route();
  initializeDataExplorer("amem-explorer-height");

  async function poll() {
    try { state.health = await getJSON("/api/health"); refreshStatus(); }
    catch (_) {}
    if (!state.health || !state.health.memory || !state.health.memory.ready) setTimeout(poll, 1500);
  }
  poll();
}
boot();
