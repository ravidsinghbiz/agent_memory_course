# AI Application Evaluation Studio

An interactive companion to the evaluation notebook. It runs deterministic
regression suites for each AI application form factor and saves inspectable
evidence to a local SQLite database.

## Run

```bash
./run.sh
```

Then open <http://127.0.0.1:8006>.

No API key or external database is required. To use a different port:

```bash
PORT=8016 ./run.sh
```

## What is included

- five evaluation stages aligned to the maturity ladder;
- 41 metric cards with formulas, targets, explanations, and failure modes;
- server-sent event progress while a suite runs;
- explicit, dimension-preserving release gates;
- a collapsible navigation rail that reduces to numbers and icons;
- a persistent, resizable, read-only Data Explorer for `evaluation_runs`,
  `evaluation_results`, and `release_gates`.

The explorer uses a fixed table allowlist and parameterized pagination. It does
not expose an arbitrary query endpoint.

## Configuration

Copy `.env.example` to `.env` only if you want to override the evidence path,
streaming delay, or port. `.env` and runtime SQLite files are ignored by Git.
