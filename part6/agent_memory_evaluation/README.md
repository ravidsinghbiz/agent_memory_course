# Evaluating agent memory with MemoRizz

This module turns MemoRizz's evaluation APIs into an educational, executable
lesson. It evaluates the memory system as a pipeline rather than treating final
answer accuracy as the only signal.

Open
[`notebook/agent_memory_evaluation.ipynb`](notebook/agent_memory_evaluation.ipynb).

```bash
python -m pip install -r requirements.txt
jupyter lab notebook/agent_memory_evaluation.ipynb
```

The notebook uses MemoRizz 0.6.3 public APIs and deterministic local fixtures,
so it needs no model key. It covers:

- benchmark catalogs, smoke/regression/paper profiles, and claim boundaries;
- source-linked semantic-memory derivation;
- label-blind query expansion, multi-lane ranking, and reciprocal-rank fusion;
- recall@k, MRR, nDCG, exact match, token F1, and answer scoring;
- the retrieved-reader versus gold-reader test for separating retrieval failures
  from reader or scorer failures;
- citation precision/recall, citation validity, and groundedness;
- real `FileSystemProvider` store, scoped search, update, forget, and provenance
  lifecycle checks;
- summary/compaction linkage and semantic-cache scope/version evidence;
- fail-closed comparability checks that prevent diagnostic runs from being
  mislabeled as paper-comparable results.

The lesson is intentionally small enough for a workshop. Production evaluation
should add official datasets and scorers, fixed revisions, repeated trials,
confidence intervals, cost and latency budgets, privacy probes, deletion
verification, and adversarial cross-tenant tests.
