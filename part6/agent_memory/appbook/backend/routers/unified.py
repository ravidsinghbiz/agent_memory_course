"""Stage 6 — the complete MemoRizz memory system in one observable chat.

This router deliberately exposes *evidence*, not a simulated dashboard. Every
turn captures the exact messages and tool schemas sent to the model. The same
scoped MemAgent powers the semantic-cache lab, explicit summary generation,
conversation compaction, entity/knowledge recall, workflow capture, and large
tool-result offloading.
"""
from __future__ import annotations

import copy
import json
import re
import threading
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

from backend.core import knowledge
from backend.core.memory import error_stream, pseudo_stream, store, unavailable_reason
from backend.core.sse import sse_response
from backend.schemas import UnifiedCacheRequest, UnifiedMessageRequest, UnifiedSessionRequest

router = APIRouter(prefix="/api/unified", tags=["unified-memory"])

USER_ID = "memory-stack-learner"
INSTRUCTION = (
    "You are Memo, the Acme Cloud engineering copilot. Use conversation memory, persona, "
    "entity facts, retrieved knowledge, reviewed skills, and summaries when relevant. "
    "When the user asks you to inspect service health or diagnostics, you MUST call "
    "inspect_service_health rather than inventing a status. Be concise, cite retrieved "
    "Acme material by title, and mention when a tool result was offloaded behind a pointer."
)
PERSONA_DATA = {
    "name": "Memo",
    "role": "Technical expert",
    "goals": "Help Acme engineers resolve retrieval incidents safely and explain every memory decision.",
    "background": "A staff AI-platform engineer specialising in retrieval, Oracle AI Database, and production agents.",
}
CACHE_CONTEXT = {
    "cache_domains": ["acme-support"],
    "cache_tags": ["memory-stack-lab"],
    "data_version": "acme-handbook-v1",
    "grounding": {
        "fact": "The Acme Cloud Pro plan allows 1,000 API requests per minute.",
        "source": "API Rate Limits",
    },
}

_sessions: dict[str, dict[str, Any]] = {}
_sessions_lock = threading.Lock()


def _jsonable(value: Any) -> Any:
    """Convert provider/Pydantic/LOB values without leaking vector payloads."""
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {
            str(key): _jsonable(item)
            for key, item in value.items()
            if str(key).lower() not in {"embedding", "vector"}
        }
    if isinstance(value, (list, tuple, set)):
        return [_jsonable(item) for item in value]
    if hasattr(value, "model_dump"):
        try:
            return _jsonable(value.model_dump(mode="json"))
        except TypeError:
            return _jsonable(value.model_dump())
    if hasattr(value, "to_dict"):
        try:
            return _jsonable(value.to_dict())
        except Exception:
            pass
    return str(value)


class CapturingModel:
    """Transparent model adapter that records the literal provider inputs."""

    def __init__(self, inner: Any) -> None:
        self.inner = inner
        self.calls: list[dict[str, Any]] = []
        self.label = "turn"

    def begin(self, label: str) -> None:
        self.calls = []
        self.label = label

    def generate(self, messages, tools=None, **kwargs):
        call = {
            "sequence": len(self.calls) + 1,
            "label": self.label,
            "messages": _jsonable(copy.deepcopy(messages)),
            "tools": _jsonable(copy.deepcopy(tools or [])),
            "usage": None,
        }
        self.calls.append(call)
        result = self.inner.generate(messages, tools=tools, **kwargs)
        try:
            call["usage"] = _jsonable(self.inner.get_last_usage())
        except Exception:
            call["usage"] = None
        return result

    def __getattr__(self, name: str) -> Any:
        return getattr(self.inner, name)


def _safe_session_id(session_id: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9_-]", "-", str(session_id or ""))[:80]
    return value or "default"


def _scope(session_id: str) -> dict[str, str]:
    safe = _safe_session_id(session_id)
    return {
        "memory_id": f"appbook-unified-{safe}",
        "user_id": USER_ID,
        "thread_id": safe,
    }


def _build_persona():
    from memorizz import Persona, RoleType

    return Persona(
        name=PERSONA_DATA["name"],
        role=RoleType.TECHNICAL_EXPERT,
        goals=PERSONA_DATA["goals"],
        background=PERSONA_DATA["background"],
    )


def _install_entity_attribute_compat(agent: Any) -> None:
    """Accept the legacy ``attribute`` key that models may still emit.

    MemoRizz 0.6.0's model-facing guidance describes an ``attribute/value``
    pair while ``EntityAttribute`` validates the field as ``name``. Keep the
    appbook's entity tool observable, but normalise either spelling before the
    provider validates and stores it.
    """
    manager = getattr(agent, "entity_memory_manager", None)
    original = getattr(manager, "upsert_entity_from_tool", None)
    if not callable(original):
        return

    def compatible_upsert(**kwargs):
        attributes = kwargs.get("attributes")
        if isinstance(attributes, list):
            normalised = []
            for item in attributes:
                if not isinstance(item, dict):
                    normalised.append(item)
                    continue
                value = dict(item)
                if not value.get("name"):
                    legacy_name = value.pop("attribute", None) or value.pop("key", None)
                    if legacy_name:
                        value["name"] = legacy_name
                normalised.append(value)
            kwargs["attributes"] = normalised
        return original(**kwargs)

    manager.upsert_entity_from_tool = compatible_upsert


def _diagnostic_rows(service_name: str) -> list[dict[str, Any]]:
    checks = [
        "deployment", "database_pool", "vector_index", "embedding_gateway",
        "retrieval_queue", "reranker", "semantic_cache", "memory_writer",
        "tool_log", "summary_worker", "oracle_listener", "health_endpoint",
    ]
    return [
        {
            "check": check,
            "status": "healthy" if check != "retrieval_queue" else "degraded",
            "detail": (
                f"{service_name}/{check}: deterministic workshop diagnostic; "
                + ("queue depth 84 exceeds warning threshold 60"
                   if check == "retrieval_queue"
                   else "probe completed inside the expected operating envelope")
            ),
        }
        for check in checks
    ]


def inspect_service_health(service_name: str) -> dict[str, Any]:
    """Return a detailed, deterministic diagnostic report for an Acme service."""
    rows = _diagnostic_rows(service_name)
    return {
        "service": service_name,
        "overall_status": "degraded",
        "summary": "One warning was found; customer traffic remains available.",
        "diagnostics": rows,
        "recommended_actions": [
            "Drain the oldest retrieval jobs before increasing worker count.",
            "Compare queue depth with the last deployment before rolling back.",
            "Keep the current vector index online while the queue recovers.",
        ],
        "evidence": {
            "probe_count": len(rows),
            "deterministic": True,
            "source": "Acme workshop observability fixture",
        },
    }


def estimate_token_cost(monthly_requests: int, tokens_per_request: int) -> dict[str, Any]:
    """Estimate a deterministic monthly token total for planning."""
    tokens = max(0, monthly_requests) * max(0, tokens_per_request)
    return {"monthly_requests": monthly_requests, "tokens_per_request": tokens_per_request,
            "monthly_tokens": tokens, "millions_of_tokens": round(tokens / 1_000_000, 3)}


def _build_session(session_id: str) -> dict[str, Any]:
    from memorizz import MemoryType, SharedMemory
    from memorizz.long_term.procedural.skillbox import Skill, SkillStatus, Skillbox
    from memorizz.long_term.procedural.workflow import Workflow
    from memorizz.memagent.builders import MemAgentBuilder
    from memorizz.tooling import ToolResultPolicy

    provider = store.require()
    scope = _scope(session_id)
    capture = CapturingModel(store.make_model())
    builder = (
        MemAgentBuilder()
        .with_instruction(INSTRUCTION)
        .with_name("Memo — Unified Memory")
        .with_persona(_build_persona())
        .with_memory_provider(provider)
        .with_memory_ids(scope["memory_id"])
        .with_model(capture)
        .with_application_mode("assistant")
        .with_tools([inspect_service_health, estimate_token_cost])
        .with_entity_memory(True)
        .with_semantic_cache(enabled=True, threshold=0.95, scope="session")
        .with_tool_result_policy(ToolResultPolicy(offload_above_chars=256, digest_chars=220))
        .with_automations_enabled(False)
    )
    agent = builder.build()
    _install_entity_attribute_compat(agent)
    # The assistant mode activates conversation/persona/entity/KB/summary memory.
    # The final lab deliberately adds every remaining MemoRizz partition so the
    # model's own system prompt and the learner inventory describe the full stack.
    agent.active_memory_types = list(MemoryType)
    agent.save()

    # Durable entity facts seeded by trusted host code.
    try:
        from memorizz import EntityMemory

        entities = EntityMemory(provider)
        entities.upsert_entity(
            name="Acme Cloud",
            entity_type="platform",
            attributes=[
                {"name": "database", "value": "Oracle AI Database", "confidence": 1.0,
                 "source": "lab seed"},
                {"name": "team", "value": "AI Platform", "confidence": 1.0,
                 "source": "lab seed"},
            ],
            memory_id=scope["memory_id"],
            user_id=scope["user_id"],
        )
    except Exception:
        pass

    # A real reviewed skill and runbook make procedural memory inspectable even
    # before the first tool call; tool-driven turns add captured workflows later.
    skillbox = Skillbox(provider, agent_id=agent.agent_id)
    if skillbox.get_skill_by_name("ops/retrieval-incident") is None:
        skillbox.add_skill(
            Skill(
                name="ops/retrieval-incident",
                description="Safely diagnose and mitigate a degraded retrieval service.",
                content=(
                    "Inspect health first. If queue depth is elevated, drain old jobs and compare "
                    "the last deployment. Roll back only when errors exceed the agreed threshold; "
                    "never replace the live vector index during initial triage."
                ),
                preconditions=["A retrieval service is degraded or returning elevated errors."],
                queries=["retrieval incident", "service health", "rollback procedure"],
                tools_used=["inspect_service_health"],
                agent_id=agent.agent_id,
                user_id=scope["user_id"],
                status=SkillStatus.ACTIVE,
            )
        )
    agent.skillbox = skillbox
    agent.skill_retrieval = True
    agent.skill_retrieval_config = {"top_k": 2, "min_similarity": 0.0}

    workflow = Workflow(
        name="retrieval_incident_response",
        description="Acme's reviewed retrieval incident runbook.",
        memory_id=scope["memory_id"],
        agent_id=agent.agent_id,
        user_id=scope["user_id"],
        user_query="How should I handle a retrieval incident?",
    )
    workflow.add_step("inspect", {"action": "Call inspect_service_health"})
    workflow.add_step("mitigate", {"action": "Drain the queue before changing the index"})
    workflow.add_step("verify", {"action": "Confirm latency and error rate recover"})
    workflow.store_workflow(provider)

    shared = SharedMemory(provider)
    shared_id = shared.create_shared_session(
        root_agent_id=agent.agent_id,
        delegate_agent_ids=[],
        workflow_id="unified-memory-lab",
        user_id=scope["user_id"],
    )
    shared.add_blackboard_entry(
        memory_id=shared_id,
        agent_id=agent.agent_id,
        content={"status": "ready", "purpose": "Unified memory evidence board"},
        entry_type="status",
    )

    return {
        "agent": agent,
        "capture": capture,
        "scope": scope,
        "lock": threading.RLock(),
        "turns": 0,
        "last_query": "",
        "last_kb_hits": [],
        "last_cache": None,
        "shared_id": shared_id,
    }


def _session(session_id: str) -> dict[str, Any]:
    key = _safe_session_id(session_id)
    with _sessions_lock:
        current = _sessions.get(key)
        if current is None:
            current = _build_session(key)
            _sessions[key] = current
        return current


def _row_id(row: dict[str, Any]) -> str | None:
    for key in (
        "summary_id", "tool_log_id", "memory_unit_id", "workflow_id", "skill_id",
        "entity_id", "agent_id", "id", "_id", "memory_id",
    ):
        if row.get(key) not in (None, ""):
            return str(row[key])
    return None


def _thread_value(row: dict[str, Any]) -> str:
    return str(row.get("thread_id") or row.get("conversation_id") or "")


def _list_rows(memory_type, *, user_id: str | None = None) -> list[dict[str, Any]]:
    provider = store.require()
    try:
        if user_id is None:
            rows = provider.list_all(memory_type, include_embedding=False)
        else:
            rows = provider.list_all(memory_type, include_embedding=False, user_id=user_id)
    except TypeError:
        rows = provider.list_all(memory_type)
    except Exception:
        return []
    return [_jsonable(row) for row in (rows or []) if isinstance(row, dict)]


def _scoped_rows(memory_type, scope: dict[str, str], *, agent_id: str | None = None,
                 limit: int = 80) -> list[dict[str, Any]]:
    rows = _list_rows(memory_type, user_id=scope["user_id"])
    out = []
    for row in rows:
        row_memory = str(row.get("memory_id") or "")
        row_agent = str(row.get("agent_id") or row.get("owner_agent_id") or "")
        row_thread = _thread_value(row)
        if row_memory and row_memory != scope["memory_id"]:
            continue
        if row_thread and row_thread != scope["thread_id"]:
            continue
        if agent_id and row_agent and row_agent != agent_id:
            continue
        out.append(row)
    return out[-limit:]


def _history(session: dict[str, Any]) -> list[dict[str, Any]]:
    from memorizz import MemoryType

    return _scoped_rows(MemoryType.CONVERSATION_MEMORY, session["scope"],
                        agent_id=session["agent"].agent_id, limit=120)


def _summaries(session: dict[str, Any]) -> list[dict[str, Any]]:
    from memorizz import MemoryType

    rows = _scoped_rows(MemoryType.SUMMARIES, session["scope"],
                        agent_id=session["agent"].agent_id, limit=40)
    for row in rows:
        row.setdefault("summary_id", _row_id(row))
    return rows


def _tool_logs(session: dict[str, Any]) -> list[dict[str, Any]]:
    agent, scope = session["agent"], session["scope"]
    try:
        rows = agent.memory_manager.list_tool_logs(
            memory_id=scope["memory_id"],
            user_id=scope["user_id"],
            thread_id=scope["thread_id"],
            limit=30,
        )
    except Exception:
        rows = []
    out = [_jsonable(row) for row in (rows or []) if isinstance(row, dict)]
    for row in out:
        row.setdefault("tool_log_id", _row_id(row))
    return out


def _entities(session: dict[str, Any]) -> list[dict[str, Any]]:
    try:
        from memorizz import EntityMemory

        rows = EntityMemory(store.require()).list_entities(
            memory_id=session["scope"]["memory_id"],
            user_id=session["scope"]["user_id"],
        )
        return [_jsonable(row) for row in (rows or []) if isinstance(row, dict)]
    except Exception:
        return []


def _capture_user_facts(session: dict[str, Any], message: str) -> None:
    """Small transparent host extractor for the seeded Stage 6 prompts."""
    try:
        from memorizz import EntityMemory

        memory = EntityMemory(store.require())
        scope = session["scope"]
        identity = re.search(r"\bI(?:'m| am)\s+([A-Z][\w.-]+)", message)
        service = re.search(r"\bI (?:own|am responsible for)\s+([\w.-]+)", message, re.I)
        name = identity.group(1) if identity else None
        if name:
            memory.upsert_entity(
                name=name,
                entity_type="person",
                attributes=[{"name": "relationship", "value": "current learner",
                             "confidence": 1.0, "source": "user statement"}],
                memory_id=scope["memory_id"], user_id=scope["user_id"],
            )
        if service:
            attributes = [{"name": "owner", "value": name or "current learner",
                           "confidence": 1.0, "source": "user statement"}]
            memory.upsert_entity(
                name=service.group(1), entity_type="service", attributes=attributes,
                memory_id=scope["memory_id"], user_id=scope["user_id"],
            )
    except Exception:
        pass


def _cache_stats(agent) -> dict[str, Any]:
    try:
        return _jsonable(agent.semantic_cache_stats())
    except Exception:
        return {"enabled": False, "hits": 0, "misses": 0, "writes": 0,
                "bypasses": 0, "evictions": 0, "size": 0}


def _cache_inspection(agent, query: str, scope: dict[str, str], context: dict[str, Any]) -> dict[str, Any]:
    try:
        value = agent.inspect_semantic_cache(
            query, thread_id=scope["thread_id"], user_id=scope["user_id"], context=context
        )
        return _jsonable(value.to_dict() if hasattr(value, "to_dict") else value)
    except Exception as exc:
        return {"lookup_query": query, "hit": False, "bypass_reason": type(exc).__name__}


def _exact_context_event(session: dict[str, Any]) -> dict[str, Any]:
    calls = session["capture"].calls
    if not calls:
        return {"type": "context", "stage": "cache_hit", "window": 128000,
                "used": 0, "segments": []}
    call = calls[-1]
    messages = call.get("messages") or []
    segments = []
    for index, message in enumerate(messages):
        role = str(message.get("role") or "message")
        content = str(message.get("content") or "")
        if not content:
            continue
        kind = "system" if role == "system" else "tools" if role == "tool" else (
            "query" if index == len(messages) - 1 and role == "user" else "history"
        )
        segments.append({
            "label": f"Exact model message · {role}", "kind": kind,
            "tokens": max(1, round(len(content) / 4)), "chars": len(content),
            "preview": content[:1400], "truncated": len(content) > 1400,
        })
    tools_text = json.dumps(call.get("tools") or [], ensure_ascii=False)
    if tools_text and tools_text != "[]":
        segments.append({"label": "Exact tool schemas", "kind": "tools",
                         "tokens": max(1, round(len(tools_text) / 4)), "chars": len(tools_text),
                         "preview": tools_text[:1400], "truncated": len(tools_text) > 1400})
    stats = session["agent"].get_context_window_stats() or {}
    used = stats.get("prompt_tokens") or sum(item["tokens"] for item in segments)
    window = stats.get("context_window_tokens") or 128000
    return {"type": "context", "stage": "final", "window": int(window),
            "used": int(used), "segments": segments}


def _memory_inventory(session: dict[str, Any], cache: dict[str, Any],
                      summaries: list[dict[str, Any]], tool_logs: list[dict[str, Any]],
                      history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    from memorizz import MemoryType

    agent, scope = session["agent"], session["scope"]
    calls = session["capture"].calls
    exact_text = json.dumps(calls, ensure_ascii=False, default=str).lower()
    workflow_rows = _scoped_rows(MemoryType.WORKFLOW_MEMORY, scope, agent_id=agent.agent_id, limit=30)
    skill_rows = _scoped_rows(MemoryType.SKILLBOX, scope, agent_id=agent.agent_id, limit=20)
    try:
        shared_row = store.require().retrieve_by_id(
            session["shared_id"], MemoryType.SHARED_MEMORY
        )
    except Exception:
        shared_row = None
    shared_items = [_jsonable(shared_row)] if isinstance(shared_row, dict) else []
    tool_items = _jsonable(agent.tool_manager.get_tool_metadata() or [])
    context_stats = _jsonable(agent.get_context_window_stats() or {})
    agent_item = {
        "agent_id": agent.agent_id,
        "name": agent.name,
        "memory_id": scope["memory_id"],
        "active_memory_types": [item.value for item in agent.active_memory_types],
    }
    entries = [
        (MemoryType.PERSONAS, [PERSONA_DATA], "in context" if "persona" in exact_text or "memo" in exact_text else "stored"),
        (MemoryType.TOOLBOX, tool_items, "in context" if any(call.get("tools") for call in calls) else "available"),
        (MemoryType.ENTITY_MEMORY, _entities(session), "in context" if "entity" in exact_text else "stored"),
        (MemoryType.SHORT_TERM_MEMORY, [context_stats] if context_stats else [], "runtime"),
        (MemoryType.KNOWLEDGE_BASE, session.get("last_kb_hits") or [], "in context" if session.get("last_kb_hits") else "available"),
        (MemoryType.CONVERSATION_MEMORY, history, "in context" if len(calls and calls[0].get("messages", [])) > 2 else "stored"),
        (MemoryType.WORKFLOW_MEMORY, workflow_rows, "captured" if workflow_rows else "available"),
        (MemoryType.SKILLBOX, skill_rows, "in context" if "approved-skills" in exact_text or "learned skill" in exact_text else "stored"),
        (MemoryType.MEMAGENT, [agent_item], "active"),
        (MemoryType.SHARED_MEMORY, shared_items, "stored"),
        (MemoryType.SUMMARIES, summaries, "in context" if summaries and "summary" in exact_text else "stored"),
        (MemoryType.SEMANTIC_CACHE, [cache], "served turn" if cache.get("hit") else "checked"),
        (MemoryType.TOOL_LOG, tool_logs, "pointer in context" if "tool_log_id" in exact_text else "stored"),
    ]
    descriptions = {
        MemoryType.PERSONAS: "Stable agent identity and operating posture.",
        MemoryType.TOOLBOX: "Callable tool schemas available to the model.",
        MemoryType.ENTITY_MEMORY: "Structured facts about people, services, and systems.",
        MemoryType.SHORT_TERM_MEMORY: "Current model context-window usage.",
        MemoryType.KNOWLEDGE_BASE: "Retrieved Acme documentation used as grounding.",
        MemoryType.CONVERSATION_MEMORY: "Persisted user and assistant turns.",
        MemoryType.WORKFLOW_MEMORY: "Stored runbooks and captured tool trajectories.",
        MemoryType.SKILLBOX: "Reviewed procedural guidance retrieved by intent.",
        MemoryType.MEMAGENT: "The persisted agent configuration and memory scope.",
        MemoryType.SHARED_MEMORY: "A durable blackboard for coordination evidence.",
        MemoryType.SUMMARIES: "Compacted conversation units with source-message links.",
        MemoryType.SEMANTIC_CACHE: "Response reuse with similarity and provenance evidence.",
        MemoryType.TOOL_LOG: "Full oversized tool results stored behind prompt pointers.",
    }
    return [
        {"type": memory_type.value, "label": memory_type.value.replace("_", " ").title(),
         "description": descriptions[memory_type], "status": status,
         "count": len(items), "items": _jsonable(items)}
        for memory_type, items, status in entries
    ]


def _snapshot(session: dict[str, Any], *, query: str = "",
              cache_hit: bool = False, cache_inspection: dict[str, Any] | None = None) -> dict[str, Any]:
    agent = session["agent"]
    stats = _cache_stats(agent)
    if cache_hit:
        cache_decision = "HIT — model call skipped"
    elif session["capture"].calls:
        cache_decision = "MISS — model executed"
    else:
        cache_decision = "Not checked yet"
    cache = {
        **stats,
        "hit": bool(cache_hit),
        "decision": cache_decision,
        "inspection": cache_inspection or session.get("last_cache"),
    }
    history = _history(session)
    summaries = _summaries(session)
    tool_logs = _tool_logs(session)
    compacted_source_ids = sorted({
        str(source_id)
        for summary in summaries
        for source_id in (summary.get("source_message_ids") or [])
        if source_id
    })
    linked_summary_ids = sorted({
        str(row.get("summary_id")) for row in history if row.get("summary_id")
    })
    return _jsonable({
        "session_id": session["scope"]["thread_id"],
        "scope": session["scope"],
        "agent_id": agent.agent_id,
        "turn": session["turns"],
        "query": query or session.get("last_query") or "",
        "backend": store.backend,
        "context": {
            "model_called": bool(session["capture"].calls),
            "model_call_count": len(session["capture"].calls),
            "calls": session["capture"].calls,
            "window_stats": agent.get_context_window_stats() or {},
            "retrieval_evidence": agent.last_retrieval_evidence(),
        },
        "cache": cache,
        "memory_types": _memory_inventory(session, cache, summaries, tool_logs, history),
        "history": history,
        "summaries": summaries,
        "summary_ids": [row.get("summary_id") or _row_id(row) for row in summaries],
        "linked_summary_ids": linked_summary_ids,
        "compacted_source_ids": compacted_source_ids,
        "tool_logs": tool_logs,
        "offloaded_tool_log_ids": [row.get("tool_log_id") or _row_id(row) for row in tool_logs],
    })


def _run_turn(session: dict[str, Any], query: str, *, label: str = "unified_chat",
              request_context: dict[str, Any] | None = None,
              retrieve_knowledge: bool = True) -> dict[str, Any]:
    with session["lock"]:
        agent, scope, capture = session["agent"], session["scope"], session["capture"]
        _capture_user_facts(session, query)
        hits = knowledge.search(store.require(), query, 3) if retrieve_knowledge else []
        session["last_kb_hits"] = hits
        context = copy.deepcopy(request_context or CACHE_CONTEXT)
        if hits:
            context["retrieved_acme_knowledge"] = hits
        context["shared_memory_reference"] = session["shared_id"]
        context["memory_scope"] = {"memory_id": scope["memory_id"], "thread_id": scope["thread_id"]}
        before = _cache_stats(agent)
        capture.begin(label)
        reply = agent.run(query, context=context, **scope)
        after = _cache_stats(agent)
        cache_hit = int(after.get("hits", 0)) > int(before.get("hits", 0))
        inspection = _cache_inspection(agent, query, scope, context)
        session["turns"] += 1
        session["last_query"] = query
        session["last_cache"] = inspection
        snapshot = _snapshot(session, query=query, cache_hit=cache_hit,
                             cache_inspection=inspection)
        return {"reply": str(reply), "snapshot": snapshot,
                "context_event": _exact_context_event(session)}


@router.get("/state")
async def state(session_id: str) -> dict[str, Any]:
    reason = unavailable_reason()
    if reason:
        return {"ready": False, "message": reason}
    session = await run_in_threadpool(_session, session_id)
    snapshot = await run_in_threadpool(_snapshot, session)
    return {"ready": True, "snapshot": snapshot}


@router.post("/message")
async def message(req: UnifiedMessageRequest):
    reason = unavailable_reason()
    if reason:
        return sse_response(error_stream(reason))
    session = await run_in_threadpool(_session, req.session_id)

    async def events():
        yield {"type": "phase", "phase": "memory", "label": "Retrieving scoped memory"}
        result = await run_in_threadpool(_run_turn, session, req.message)
        yield result["context_event"]
        yield {"type": "phase", "phase": "answer", "label": "Answer ready"}
        async for event in pseudo_stream(result["reply"]):
            yield event
        yield {"type": "snapshot", "snapshot": result["snapshot"]}
        yield {"type": "final", "reply": result["reply"]}

    return sse_response(events())


@router.post("/cache/run")
async def cache_run(req: UnifiedCacheRequest) -> dict[str, Any]:
    """Run the same stable request twice; the second turn should skip the model."""
    reason = unavailable_reason()
    if reason:
        return {"ok": False, "message": reason}
    session = await run_in_threadpool(_session, req.session_id)

    def run_pair() -> dict[str, Any]:
        with session["lock"]:
            agent = session["agent"]
            try:
                # One MemAgent is created per browser lab session, so clearing
                # this agent-local cache is both deterministic and isolated.
                agent.cache_manager.clear_cache()
            except Exception:
                pass
            before = _cache_stats(agent)
            first = _run_turn(session, req.query, label="semantic_cache_first",
                              request_context=CACHE_CONTEXT, retrieve_knowledge=False)
            middle = _cache_stats(agent)
            second = _run_turn(session, req.query, label="semantic_cache_second",
                               request_context=CACHE_CONTEXT, retrieve_knowledge=False)
            after = _cache_stats(agent)
            return _jsonable({
                "ok": True,
                "query": req.query,
                "first": {"reply": first["reply"], "snapshot": first["snapshot"]},
                "second": {"reply": second["reply"], "snapshot": second["snapshot"]},
                "stats": {"before": before, "after_first": middle, "after_second": after},
                "proof": {
                    "first_model_called": first["snapshot"]["context"]["model_called"],
                    "second_model_called": second["snapshot"]["context"]["model_called"],
                    "second_cache_hit": second["snapshot"]["cache"]["hit"],
                },
            })

    return await run_in_threadpool(run_pair)


@router.post("/summarize")
async def summarize(req: UnifiedSessionRequest) -> dict[str, Any]:
    """Compact unsummarized conversation rows using MemAgent.generate_summaries."""
    reason = unavailable_reason()
    if reason:
        return {"ok": False, "message": reason}
    session = await run_in_threadpool(_session, req.session_id)

    def generate() -> dict[str, Any]:
        with session["lock"]:
            scope, agent, capture = session["scope"], session["agent"], session["capture"]
            before = _history(session)
            before_unsummarized = sum(1 for row in before if not row.get("summary_id"))
            capture.begin("manual_summarization")
            summary_ids = agent.generate_summaries(
                days_back=7,
                max_memories_per_summary=50,
                memory_id=scope["memory_id"],
                user_id=scope["user_id"],
                thread_id=scope["thread_id"],
            )
            for summary_id in summary_ids or []:
                agent._track_summary_ids([str(summary_id)])
            after = _history(session)
            after_unsummarized = sum(1 for row in after if not row.get("summary_id"))
            snapshot = _snapshot(session)
            return _jsonable({
                "ok": True,
                "created_summary_ids": [str(value) for value in (summary_ids or [])],
                "before": {"messages": len(before), "unsummarized": before_unsummarized},
                "after": {"messages": len(after), "unsummarized": after_unsummarized},
                "compacted_count": max(0, before_unsummarized - after_unsummarized),
                "snapshot": snapshot,
            })

    return await run_in_threadpool(generate)


@router.post("/reset")
def reset(req: UnifiedSessionRequest) -> dict[str, Any]:
    """Drop only the in-process handle; durable rows remain visible in the explorer."""
    key = _safe_session_id(req.session_id)
    with _sessions_lock:
        session = _sessions.pop(key, None)
    if session:
        session["agent"].close(close_memory_provider=False)
    return {"ok": True, "durable_memory_preserved": True}
