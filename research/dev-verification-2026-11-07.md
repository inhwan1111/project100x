# 2026-11-07 verification: QQQ integration fixture correction

## Executed evidence
- Retrieved the current test-branch backtest engine, QQQ CSV, and v0.9 parser from GitHub.
- Evaluated the retrieved JavaScript engine in a V8 runtime, parsed the CSV's 100 bars in chronological order, and called engine.validate/backtest.
- OHLCV validation: ok. Trend pullback: 6 trades, rounded net returns [1.4899,-0.5863,-1.9217,2.7893,-0.7945,-3.5520]%. Volume breakout: 0 trades. Oversold rebound: **0 trades**.
- The previously pinned oversold trade on 2026-10-23 / 2026-10-26 / 2026-10-30 was NOT produced by this exact engine/data pair. Its claimed -2.6360% return was therefore not a valid integration expectation. Corrected the expected dates and net returns to empty arrays in commit b2db68097b96ee317bd6113bd81f0de3d68e20a6.
- Ran four direct v0.9 parser checks in the same runtime: valid CSV, invalid calendar date rejection, duplicate symbol/date rejection, mixed currency rejection; 4/4 passed.
- Local git clone failed because github.com DNS resolution failed. No full Node.js test suite execution or GitHub Actions success observed.

## Follow-up
- Re-run complete Node.js suites and CI, including corrected QQQ fixture.
- Add independent signal-by-signal verification and larger out-of-sample data.
- Do not describe the 2026-10-26 oversold trade as executed or validated in project reports.

Guardrails: test branch only; no production deployment, live trading, hosting charges, or project100x_v1 writes.
