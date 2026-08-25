# Agent systems, memory, and evaluation

This section of the course connects five complementary questions:

1. **What shape should the AI application take?** The image-free AI maturity
   ladder builds the same Acme Cloud assistant as a chatbot, RAG system,
   workflow, tool-using agent, and autonomous builder.
2. **How should an agent remember?** The MemoRizz 0.6 track builds a scoped,
   memory-first copilot and then examines every memory type in a dedicated field
   guide.
3. **How should each application form be evaluated?** The application-
   evaluation lesson maps metrics and release gates to each maturity level.
4. **What do different memory architectures cost?** The live GPT-5.5 benchmark
   compares basic OAMP, naive full history, and cache-friendly OAMP on exact
   tokens, cache hits, latency, response quality, compaction, and extraction.
5. **How do we evaluate memory itself?** The MemoRizz evaluation lesson traces
   the full path from source-linked memories to retrieval, reader quality,
   grounding, lifecycle behavior, cache evidence, and claim comparability.

The teaching modules have runnable notebooks, and three include interactive
FastAPI appbooks. The benchmarking lesson also saves a machine-readable result.

| Module | Start here | Companion |
|---|---|---|
| [`ai_maturity_form_factors/`](ai_maturity_form_factors/) | [`notebook/ai_maturity_form_factors_notebook.ipynb`](ai_maturity_form_factors/notebook/ai_maturity_form_factors_notebook.ipynb) | [`appbook/`](ai_maturity_form_factors/appbook/) |
| [`agent_memory/`](agent_memory/) | [`agent_memory_zero_to_hero.ipynb`](agent_memory/agent_memory_zero_to_hero.ipynb), [`agent_memory_zero_to_hero_oracle.ipynb`](agent_memory/agent_memory_zero_to_hero_oracle.ipynb), then [`memory_types.ipynb`](agent_memory/memory_types.ipynb) | [`appbook/`](agent_memory/appbook/) |
| [`ai_application_evaluation/`](ai_application_evaluation/) | [`notebook/ai_application_evaluation.ipynb`](ai_application_evaluation/notebook/ai_application_evaluation.ipynb) | [`appbook/`](ai_application_evaluation/appbook/) |
| [`agent_memory_benchmarking_evaluation/`](agent_memory_benchmarking_evaluation/) | [`notebook/oracle_agent_memory_benchmarks_openai.ipynb`](agent_memory_benchmarking_evaluation/notebook/oracle_agent_memory_benchmarks_openai.ipynb) | [`openai_benchmark_report.json`](agent_memory_benchmarking_evaluation/notebook/artifacts/openai_benchmark_report.json) |
| [`agent_memory_evaluation/`](agent_memory_evaluation/) | [`notebook/agent_memory_evaluation.ipynb`](agent_memory_evaluation/notebook/agent_memory_evaluation.ipynb) | MemoRizz diagnostic report |

All three appbooks include a persistent, resizable, read-only Data Explorer.
Each explorer exposes only its application's allowlisted evidence tables,
metadata, and paginated rows; none exposes an arbitrary SQL surface.

## Design choices

- No image blocks or image-gallery endpoints are required by the course.
- The Oracle Agent Memory benchmark and AI-application evaluation use live
  hosted models and Oracle, make no fixture substitution, and preserve usage
  evidence with their results. The MemoRizz diagnostic lesson uses controlled
  evidence where its metric contract requires repeatability.
- The Oracle zero-to-hero and memory-types notebooks use the dedicated
  `MEMORIZZ` schema and fail closed instead of silently switching providers.
- Hosted-model examples prompt for credentials at runtime and do not store keys
  in notebook source.
- Every runtime memory example supplies host-owned `memory_id`, `user_id`, and
  `thread_id` scope.
- Appbook secrets are read only from environment variables or ignored `.env`
  files. Process/CI variables take precedence.

## Quickstart

```bash
# Filesystem notebook plus Oracle-backed notebooks
python -m pip install "memorizz[filesystem,oracle]>=0.6.3,<0.7.0" jupyter
jupyter lab agent_memory

# An appbook
cd agent_memory/appbook
cp .env.example .env       # configure runtime values; .env is ignored
./run.sh
```

The AI maturity notebook requires the local Oracle database for its database-
specific RAG/SQL sections. From that module, run `./oracle.sh start` first. Its
appbook can fall back to an in-memory NumPy retriever when Oracle is unavailable.
The same helper provisions a separate 256-dimensional `MEMORIZZ` schema for the
Oracle agent-memory notebook and appbook.
