# AI application evaluation

This module turns the Acme Cloud support scenario into an evaluation system for
five application form factors: chatbot, retrieval-augmented generation,
deterministic workflow, tool-using agent, and autonomous builder.

The lesson keeps task quality, safety, retrieval, trajectory, latency, cost, and
reliability as separate evidence dimensions. It deliberately avoids a single
weighted “quality score” that could hide a release-blocking failure.

## Start here

- [`notebook/ai_application_evaluation.ipynb`](notebook/ai_application_evaluation.ipynb)
  is the detailed, fully live lesson. Claude Sonnet 5 produces every application
  output, GPT-5.6 Luna judges semantic criteria, OpenAI produces fresh embeddings,
  and Oracle stores and retrieves the complete evidence trail. The notebook also
  sends nested application/provider/retriever/tool traces and computed feedback
  to LangSmith. All three API keys are requested securely with `getpass` when
  absent from the environment.
- [`appbook/`](appbook/) is the interactive evaluation studio. It provides five
  runnable stages, metric definitions and formulas, release gates, persisted
  evidence, and a read-only Data Explorer.

## Run the notebook

Use the course's `oracle_demos` kernel, or install the small local dependency
set:

```bash
python -m pip install -r requirements.txt
jupyter lab notebook/ai_application_evaluation.ipynb
```

Every saved code cell has been executed against the hosted APIs and local Oracle
database. Model-quality misses remain visible as evidence rows; only integration
failures stop notebook execution.

The retrieval lesson compares Oracle Text keyword search, native Oracle vector
search, and hybrid reciprocal-rank fusion on the same compact Acme contract.
Documents and queries are embedded during execution, searched in Oracle, and
graded with recall, MRR, nDCG, and latency. No precomputed vectors or saved model
responses are used.

Rendered Matplotlib dashboards make the live evidence easier to compare: ranking
quality versus retrieval latency, input/output tokens versus configured cost,
form-factor pass rates, and every observed release gate against its threshold.

## Inspect the LangSmith evidence

The stable tracing project is `agent-memory-course-ai-application-evaluation`.
Filter traces by the notebook's printed `oracle_run_id`, then expand a trace to
inspect the actual provider, retrieval, and tool boundaries and their attached
feedback. The run also synchronizes one labelled Acme dataset so later prompt,
model, or retrieval experiments can be compared against the same contract.

## Run the appbook

```bash
cd appbook
./run.sh
```

Open <http://127.0.0.1:8006>. The navigation collapses to numbered icons, and
the Data Explorer exposes only allowlisted evaluation tables—never arbitrary
SQL.

## Metric families

The notebook and appbook explain the formula, direction, target, interpretation,
and common trap for each metric. The covered families include:

- classification: accuracy, precision, recall, F1, and macro F1;
- safety: attack success rate and over-refusal rate;
- retrieval and RAG: precision, recall, hit rate, MRR, nDCG, groundedness,
  answer relevance, context relevance, and citation precision/recall;
- workflows: stage accuracy, pipeline success, validation, and recovery;
- agents: tool selection, argument correctness, trajectory efficiency, task
  success, side-effect safety, rollback success, and human intervention;
- operations: observed latency, token usage, cost per successful task, and
  release gates.
