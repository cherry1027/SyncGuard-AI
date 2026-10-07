import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_COMPARISON,
  runComparison,
  timeToThreshold,
  timingErrorNs,
} from "../lib/timing.ts";

test("converts a ppb frequency offset into nanoseconds of phase error", () => {
  assert.equal(timingErrorNs(10, 1, 0, 0), 10);
});

test("finds time to an absolute timing threshold", () => {
  const hit = timeToThreshold({
    duration: 100,
    driftPpb: 2,
    agingPpbPerHour: 0,
    tempSwingNs: 0,
    thresholdNs: 100,
  });
  assert.equal(hit, 50);
});

test("seeded observations and metrics are reproducible", () => {
  const first = runComparison(DEFAULT_COMPARISON);
  const second = runComparison(DEFAULT_COMPARISON);
  assert.deepEqual(first, second);
});

test("all three comparison models produce finite holdover metrics", () => {
  const { metrics } = runComparison(DEFAULT_COMPARISON);
  assert.equal(metrics.length, 3);
  for (const metric of metrics) {
    assert.ok(Number.isFinite(metric.rmse));
    assert.ok(Number.isFinite(metric.finalError));
    assert.ok(metric.rmse >= 0);
  }
});

test("prediction models beat last-value hold under the default scenario", () => {
  const { metrics } = runComparison(DEFAULT_COMPARISON);
  const [baseline, linear, kalman] = metrics;
  assert.ok(linear.rmse < baseline.rmse);
  assert.ok(kalman.rmse < baseline.rmse);
});
