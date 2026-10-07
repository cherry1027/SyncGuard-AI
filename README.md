# SyncGuard AI

**5G Precision Timing & Holdover Lab**

Interactive React + TypeScript lab for exploring timing error after GNSS loss.

🔗 **Live demo:** https://syncguard-ai-timing-lab.charanvaranasi44.workers.dev

## Features

- Simulate GNSS outages and oscillator drift
- Adjust outage duration, frequency offset, aging, thermal wander, and error threshold
- Calculate time-to-threshold and final phase error
- Compare three holdover strategies:
- Last-value baseline
- Linear least-squares prediction
- Two-state phase/frequency Kalman filter
- Reproducible synthetic observations using seeded noise
- RMSE and final-error scorecards
- Responsive dark technical interface
- Unit-tested timing calculations

## Pages

### Holdover Lab

Models oscillator phase error after GNSS loss using:

- Constant frequency offset
- Linear oscillator aging
- Sinusoidal thermal wander
- Configurable timing-error threshold

### Model Comparison

Uses the same seeded synthetic dataset to compare baseline, linear prediction, and Kalman filtering during holdover.

## Assumptions

- Phase error is measured in nanoseconds.
- A 1 ppb frequency offset produces 1 ns of phase error per second.
- GNSS observations arrive at 1 Hz during the lock period.
- Observation noise is zero-mean Gaussian noise.
- Linear prediction uses the final 60 locked samples.
- The Kalman filter estimates phase and frequency using fixed process and measurement noise.
- No observations are available after GNSS loss.
- Results are illustrative and are not hardware qualification data.

## Local Development

Requires Node.js 22.13 or newer.

npm install
npm run dev

Open http://127.0.0.1:5173

## Tests

npm test

The test suite covers threshold timing, ppb conversion, deterministic seeded observations, finite model metrics, and prediction performance.

## Production Build

npm run build

## Deployment

Deployed to Cloudflare Workers using Wrangler:

npx wrangler deploy --config dist/server/wrangler.json --name syncguard-ai-timing-lab

## Technology

- React
- TypeScript
- Vinext/Vite
- Tailwind CSS
- Cloudflare Workers
- Node.js test runner

No backend, external APIs, database, or hardware integration is required.
