const I = {
  chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/><path d="M2 20h20"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11 12 3l9 8"/><path d="M5 10v11h14V10"/></svg>',
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.2-4.5A8 8 0 1 1 21 12Z"/></svg>',
  rag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></svg>',
  flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/><path d="M10 6h4a3 3 0 0 1 3 3v6M14 18H9a3 3 0 0 1-3-3V9"/></svg>',
  agent:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="7" width="14" height="12" rx="3"/><path d="M12 7V3m-3 0h6M9 12h.01M15 12h.01M9 16h6"/></svg>',
  build:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16"/></svg>',
  chevron:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};
const TONES=["#4d8dff","#22b8a7","#a5c832","#f1a126","#ff6b4a"];
const ICONS=[I.chat,I.rag,I.flow,I.agent,I.build];
const $=(s,r=document)=>r.querySelector(s);
const esc=(value)=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pretty=(key)=>key.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const state={catalog:null,health:null,route:"overview",running:false,explorer:{tables:[],selected:null}};

async function json(url,options){const r=await fetch(url,options);if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}
async function stream(url,onEvent){
  const r=await fetch(url,{method:"POST"}); if(!r.ok||!r.body)throw new Error(`HTTP ${r.status}`);
  const reader=r.body.getReader(),decoder=new TextDecoder(); let buffer="";
  while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});
    let boundary;while((boundary=buffer.search(/\r?\n\r?\n/))>=0){const block=buffer.slice(0,boundary);const match=buffer.slice(boundary).match(/^\r?\n\r?\n/);buffer=buffer.slice(boundary+match[0].length);
      let event="message",data="";for(const line of block.split(/\r?\n/)){if(line.startsWith("event:"))event=line.slice(6).trim();if(line.startsWith("data:"))data+=line.slice(5).trim();}
      if(event==="end")return;if(data)onEvent(JSON.parse(data));
    }
  }
}

function metricValue(key,value){
  const def=state.catalog.metrics[key]; if(def?.unit==="USD")return `$${Number(value).toFixed(3)}`;
  return `${Math.round(Number(value)*100)}%`;
}
function targetText(def){return `${def.direction==="high"?"≥":"≤"} ${def.unit==="USD"?"$"+def.target.toFixed(2):Math.round(def.target*100)+"%"}`;}

function renderSidebar(){
  const route=state.route;
  $("#sidebar").innerHTML=`
    <div class="brand"><div class="brand-mark">${I.chart}</div><div class="brand-copy"><strong>Evaluation Studio</strong><span>Five evidence boundaries</span></div></div>
    <button class="collapse" id="collapse" title="Toggle navigation">${I.chevron}</button>
    <div class="nav-kicker">Evaluation ladder</div>
    <nav class="nav">
      <a class="nav-item ${route==="overview"?"active":""}" href="#/overview" title="Overview"><span class="nav-icon">${I.home}</span><span class="nav-label">Overview</span></a>
      ${state.catalog.form_factors.map((ff,i)=>`<a class="nav-item ${route===ff.id?"active":""}" href="#/${ff.id}" title="${esc(ff.name)}" style="--nav-accent:${TONES[i]}"><span class="nav-num">${ff.number}</span><span class="nav-icon">${ICONS[i]}</span><span class="nav-label">${esc(ff.name)}</span></a>`).join("")}
    </nav>
    <div class="status-card"><div class="status-line"><i></i><span>${state.health?.mode||"loading"}</span></div><div class="status-line"><i></i><span>${state.health?.storage||"SQLite"} evidence store</span></div></div>`;
  $("#collapse").onclick=()=>{const next=document.documentElement.dataset.sidebar==="expanded"?"collapsed":"expanded";document.documentElement.dataset.sidebar=next;localStorage.setItem("aieval6-sidebar",next);};
}

function overview(){
  const ffs=state.catalog.form_factors;
  $("#main").innerHTML=`<div class="page">
    <div class="eyebrow">AI application evaluation</div><h1>Measure the system you actually built.</h1>
    <p class="lead">One Acme Cloud support scenario, five application forms, and a different evidence boundary at every rung. Run deterministic regression suites, inspect every metric, and keep the per-case evidence behind each release decision.</p>
    <div class="hero-grid">
      <section class="panel panel-pad"><h2>Evaluation is a pipeline</h2><p>The target and evaluator are different systems. Version both, retain failures, and never let an aggregate replace the trace.</p><div class="contract"><span>Dataset</span><i>→</i><span>Target</span><i>→</i><span>Evidence</span><i>→</i><span>Evaluators</span><i>→</i><span>Release gate</span></div></section>
      <section class="panel panel-pad principles"><div class="principle"><b>01</b><span>Use exact checks when the output contract is exact.</span></div><div class="principle"><b>02</b><span>Separate retrieval, generation, trajectory, and outcome.</span></div><div class="principle"><b>03</b><span>Hard safety gates cannot be averaged away.</span></div></section>
    </div>
    <div class="section-head"><div><h2>Five form factors</h2><p>Choose a stage to run its complete evaluation suite.</p></div></div>
    <div class="stage-grid">${ffs.map((ff,i)=>`<a class="panel stage-card" href="#/${ff.id}" style="--tone:${TONES[i]}"><div class="stage-top"><span class="stage-number">${ff.number}</span><span class="stage-count">${ff.metrics.length} metrics</span></div><h3>${esc(ff.name)}</h3><p>${esc(ff.lens)}</p><div class="failure">${esc(ff.failure)}</div></a>`).join("")}</div>
    <div class="section-head"><div><h2>Metric glossary</h2><p>Definitions, formulas, direction, target, and the failure mode each metric can hide.</p></div></div>
    <div id="glossary"></div>
  </div>`;
  renderGlossary("all");
}

function renderGlossary(family){
  const metrics=Object.entries(state.catalog.metrics).filter(([,def])=>family==="all"||def.family===family);
  $("#glossary").innerHTML=`<div class="glossary-controls"><button class="filter ${family==="all"?"active":""}" data-family="all">All</button>${Object.entries(state.catalog.families).map(([id,item])=>`<button class="filter ${family===id?"active":""}" data-family="${id}">${esc(item.label)}</button>`).join("")}</div><div class="metric-grid">${metrics.map(([key,def])=>metricCard(key,def)).join("")}</div>`;
  document.querySelectorAll("[data-family]").forEach(btn=>btn.onclick=()=>renderGlossary(btn.dataset.family));
}
function metricCard(key,def){return `<article class="panel metric-card"><div class="metric-top"><div><h3>${esc(def.label)}</h3><div class="metric-family">${esc(state.catalog.families[def.family].label)}</div></div><span class="target">${targetText(def)}</span></div><p>${esc(def.description)}</p><div class="formula">${esc(def.formula)}</div><div class="trap">Watch: ${esc(def.trap)}</div></article>`;}

function stageView(id){
  const ff=state.catalog.form_factors.find(x=>x.id===id),i=ff.number-1;
  document.documentElement.style.setProperty("--accent",TONES[i]);
  $("#main").innerHTML=`<div class="page">
    <div class="eyebrow">Form factor ${String(ff.number).padStart(2,"0")} · ${esc(ff.lens)}</div><h1>Evaluating the ${esc(ff.name)}</h1>
    <p class="lead"><b>Failure boundary:</b> ${esc(ff.failure)}. Every metric below answers a distinct diagnostic question; their release gates remain separate.</p>
    <div class="section-head"><div><h2>Metric contract</h2><p>${ff.metrics.length} metrics · click-free definitions visible in full.</p></div></div>
    <div class="metric-grid">${ff.metrics.map(key=>metricCard(key,state.catalog.metrics[key])).join("")}</div>
    <aside class="panel limitation"><b>Limitation that sets up the next boundary</b><p>${esc(ff.limitation)}</p></aside>
    <section class="panel runner"><div class="runner-head"><div><h2>Run the regression suite</h2><p>Recorded target outputs · real deterministic evaluators · every row persisted.</p></div><button class="btn" id="run">${I.play} Run ${state.catalog.case_counts[id]} cases</button></div><div class="runner-progress"><i id="progress"></i></div><div class="runner-status" id="run-status">Ready · no model key required</div><div id="summary"></div><div class="result-wrap"><table class="results"><thead><tr><th>Case</th><th>Per-case scores</th><th>Evaluator evidence</th></tr></thead><tbody id="result-body"><tr><td colspan="3" class="empty">Run the suite to stream its evidence.</td></tr></tbody></table></div></section>
  </div>`;
  $("#run").onclick=()=>runSuite(id);
}

async function runSuite(id){
  if(state.running)return;state.running=true;const button=$("#run"),body=$("#result-body");button.disabled=true;body.innerHTML="";$("#summary").innerHTML="";$("#progress").style.width="0%";
  try{await stream(`/api/evaluate/${id}`,event=>{
    if(event.type==="start")$("#run-status").textContent=`run ${event.run_id.slice(0,8)} · 0/${event.total}`;
    if(event.type==="case"){
      $("#progress").style.width=`${event.index/event.total*100}%`;$("#run-status").textContent=`${event.index}/${event.total} · persisted ${event.case_id}`;
      body.insertAdjacentHTML("beforeend",`<tr><td><b>${esc(event.label)}</b><br><small>${esc(event.case_id)}</small></td><td><div class="mini-scores">${Object.entries(event.scores).map(([key,value])=>`<span class="mini-score">${esc(pretty(key))} ${metricValue(key,Number(value))}</span>`).join("")}</div></td><td class="evidence">${esc(JSON.stringify(event.evidence,null,2))}</td></tr>`);
    }
    if(event.type==="summary")renderSummary(event);
  });await refreshExplorer();}
  catch(error){$("#run-status").textContent=`Error: ${error.message}`;}
  finally{state.running=false;button.disabled=false;}
}
function renderSummary(event){
  const cards=Object.entries(event.summary).map(([key,value])=>{const gate=event.gates[key];return `<div class="score ${gate.passed?"pass":"fail"}"><b>${metricValue(key,value)}</b><span>${esc(state.catalog.metrics[key].label)} · target ${targetText(state.catalog.metrics[key])}</span></div>`;}).join("");
  $("#summary").innerHTML=`<div class="score-grid">${cards}</div><div class="release ${event.passed?"pass":"fail"}">${event.passed?"RELEASE GATE PASSED":"RELEASE BLOCKED"} · ${Object.values(event.gates).filter(x=>!x.passed).length} metric threshold(s) failed · run ${event.run_id}</div>`;
  $("#run-status").textContent=`complete · ${event.passed?"release gate passed":"failures retained for diagnosis"}`;
}

function route(){state.route=(location.hash.replace(/^#\//,"")||"overview").split("?")[0];if(!state.catalog)return;renderSidebar();if(state.route==="overview")overview();else if(state.catalog.form_factors.some(x=>x.id===state.route))stageView(state.route);else{location.hash="#/overview";}$("#main").focus({preventScroll:true});}

async function refreshExplorer(){
  try{const [tables,activity]=await Promise.all([json("/api/data-explorer/tables"),json("/api/data-explorer/activity")]);state.explorer.tables=tables.tables;$("#explorer-summary").textContent=`${tables.backend} · ${tables.tables.reduce((n,t)=>n+t.rows,0)} rows`;$("#explorer-tables").innerHTML=tables.tables.map(t=>`<button class="table-btn ${state.explorer.selected===t.name?"active":""}" data-table="${t.name}"><b>${esc(t.name)}</b><span>${t.rows} rows · ${esc(t.description)}</span></button>`).join("");document.querySelectorAll("[data-table]").forEach(btn=>btn.onclick=()=>openTable(btn.dataset.table));$("#explorer-activity").innerHTML=activity.items.length?activity.items.map(item=>`<div class="activity-item"><b><span>${esc(item.form_factor)}</span><em class="${item.passed?"ok":"bad"}">${item.status==="complete"?(item.passed?"PASS":"BLOCKED"):"RUNNING"}</em></b><span>${esc(item.run_id.slice(0,12))} · ${esc(item.started_at.slice(0,19))}</span></div>`).join(""):'<div class="empty">No runs yet.</div>';
  }catch(error){$("#explorer-summary").textContent=`Unavailable · ${error.message}`;}
}
async function openTable(name){state.explorer.selected=name;await refreshExplorer();const data=await json(`/api/data-explorer/tables/${encodeURIComponent(name)}/rows?limit=50`);$("#explorer-table-head").textContent=`${name} · ${data.total} total rows`;const columns=data.rows.length?Object.keys(data.rows[0]):[];$("#explorer-grid").innerHTML=columns.length?`<thead><tr>${columns.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${data.rows.map(row=>`<tr>${columns.map(c=>`<td title="${esc(typeof row[c]==="string"?row[c]:JSON.stringify(row[c]))}">${esc(typeof row[c]==="string"?row[c]:JSON.stringify(row[c]))}</td>`).join("")}</tr>`).join("")}</tbody>`:'<tbody><tr><td class="empty">No rows yet.</td></tr></tbody>';}

function bindShell(){
  $("#explorer-toggle").onclick=()=>{const box=$("#data-explorer"),open=!box.classList.contains("open");box.classList.toggle("open",open);$("#explorer-body").hidden=!open;$("#explorer-toggle").setAttribute("aria-expanded",String(open));if(open)refreshExplorer();};
  $("#explorer-refresh").onclick=refreshExplorer;
  window.addEventListener("hashchange",route);
}
async function init(){
  bindShell();try{[state.catalog,state.health]=await Promise.all([json("/api/catalog"),json("/api/health")]);renderSidebar();route();refreshExplorer();}catch(error){$("#main").innerHTML=`<div class="page"><h1>Unable to load evaluation studio</h1><p>${esc(error.message)}</p></div>`;}
}
init();
