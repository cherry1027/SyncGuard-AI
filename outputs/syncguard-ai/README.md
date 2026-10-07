# SyncGuard AI

A local-only React + TypeScript lab for exploring 5G precision timing holdover after GNSS loss.

## Pages

- `/` — adjustable GNSS outage and oscillator drift model with time-to-threshold.
- `/compare` — seeded observations and RMSE comparison for last-value baseline, least-squares linear prediction, and a two-state phase/frequency Kalman filter.

## Run

```bash
npm run dev
npm test
npm run build
```

## Model assumptions

- Phase error is reported in nanoseconds; a constant 1 ppb frequency offset contributes 1 ns of phase error per elapsed second.
- Oscillator truth combines constant frequency offset, linear aging, and bounded sinusoidal thermal wander.
- Comparison observations arrive at 1 Hz during the 120-second GNSS lock window and contain seeded zero-mean Gaussian noise.
- Baseline holds the final observation. Linear prediction fits the final 60 locked observations. The Kalman filter uses a phase/frequency state, constant-velocity transition, fixed process noise, and measurement variance derived from the selected observation noise.
- No measurement updates occur after GNSS loss. Results are illustrative and are not hardware qualification data.
