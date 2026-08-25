# Oracle Agent Memory benchmarking with OpenAI GPT-5.5

This module is a direct adaptation of Oracle's
[`oracle_agent_memory_benchmarks_oci.ipynb`](https://github.com/oracle-devrel/oracle-ai-developer-hub/blob/main/notebooks/agent_memory/oracle_agent_memory_benchmarks_oci.ipynb).
It keeps Oracle AI Database as the memory provider and preserves the reference
workload and evaluation structure, but replaces OCI inference and embeddings
with direct OpenAI API calls.

## Start here

- [`notebook/oracle_agent_memory_benchmarks_openai.ipynb`](notebook/oracle_agent_memory_benchmarks_openai.ipynb)
  contains the runnable lesson and all saved outputs.
- [`notebook/artifacts/openai_benchmark_report.json`](notebook/artifacts/openai_benchmark_report.json)
  contains the secret-free machine-readable result.

The notebook compares three patterns on the same ChromAtlas-ND conversation:

1. basic OAMP with a retrieved context card and synchronous memory maintenance;
2. naive process-local full history;
3. cache-friendly OAMP with Oracle persistence, vector search, scheduled
   compaction, and offline memory extraction.

It measures provider-reported answer tokens, all hot-path model tokens, prompt-
cache hits, retrieval and end-to-end latency, context-grounded response quality,
compaction usage, and offline Oracle memory extraction/retrieval. Token counts
come from OpenAI `response.usage`; the notebook does not use the reference
`chars/4` estimate.

Six inline Matplotlib figures are saved with the executed notebook: the five
detailed token, latency, and judge charts from the reference evaluation plus a
four-panel executive dashboard that combines token boundaries, cache share,
latency percentiles, and judge outcomes.

## Saved live run

The saved execution completed 24 of the preserved 80 turns. Twenty-four reaches
the first recall questions and the turn-20 compaction boundary while keeping the
course run practical. Set `MAX_BENCHMARK_TURNS=80` for the full workload.

- 16/16 code cells completed with no errors;
- 170 GPT-5.5 Responses API calls were recorded;
- 100 durable facts were written through Oracle Agent Memory;
- a fresh Oracle vector search returned five verification hits;
- all temporary benchmark threads were deleted and both connections closed.

## Run it

Use the `oracle_demos` kernel or install the module requirements. Set
`OPENAI_API_KEY` and `DB_PASSWORD` in the environment for non-interactive
execution; an interactive kernel prompts securely when either is absent.

```bash
python -m pip install -r requirements.txt
MAX_BENCHMARK_TURNS=24 jupyter lab notebook/oracle_agent_memory_benchmarks_openai.ipynb
```

The report is a measurement of one prompt set, model alias/snapshot, database,
machine, and network path—not a universal provider guarantee. Compare p50 and
p95, preserve the answer-vs-maintenance token boundary, and add human review
before using the judge tally for a production release decision.
