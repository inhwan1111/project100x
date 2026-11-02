# QQQ historical strategy research — 2026-11-02

Status: research only; no trade execution or validated investment edge.

## Input and assumptions
- Source: market-data/QQQ-daily.csv on main, retrieved 2026-11-02.
- 100 daily OHLCV bars, 2026-06-10 through 2026-10-30, ascending for calculations.
- Same entry and signal logic as p2-backtest-core.js: signal on previous completed close, enter next open, exit close of fifth holding trading day, no overlapping positions per strategy.
- Fees: 0.15% on entry and 0.15% on exit; no slippage, taxes, FX or dividends modeled.
- Independent reimplementation of the existing formula; not a direct execution of the engine.

## Results
| Strategy | Completed trades | Wins | Win rate | Mean net return per trade |
|---|---:|---:|---:|---:|
| 추세 눌림목 | 6 | 2 | 33.33% | -0.4292% |
| 거래량 돌파 | 0 | 0 | N/A | N/A |
| 과매도 반등 | 1 | 0 | 0% | -2.6360% |

### Completed trades (net return)
- 추세 눌림목: signal 2026-08-03, entry 08-04, exit 08-10: +1.4899%
- 추세 눌림목: signal 2026-08-27, entry 08-28, exit 09-03: -0.5863%
- 추세 눌림목: signal 2026-09-04, entry 09-08, exit 09-14: -1.9217%
- 추세 눌림목: signal 2026-09-17, entry 09-18, exit 09-24: +2.7893%
- 추세 눌림목: signal 2026-10-01, entry 10-02, exit 10-08: -0.7945%
- 추세 눌림목: signal 2026-10-08, entry 10-09, exit 10-15: -3.5520%
- 과매도 반등: signal 2026-10-23, entry 10-26, exit 10-30: -2.6360%

## Gates before any recommendation
1. Run p2-backtest-core.js itself against the CSV and compare each trade with this independent result.
2. Expand historical coverage and test out of sample; 100 bars is insufficient.
3. Confirm data provider, corporate-action adjustment, missing days and cost assumptions.
4. Verify mobile functionality on device. Never modify project100x_v1 during testing.

No changes to main, saved portfolios, or production deployment.
