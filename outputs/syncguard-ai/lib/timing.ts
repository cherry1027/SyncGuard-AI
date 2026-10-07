export type TimingPoint = {
  t: number;
  truth: number;
  observation?: number;
  baseline?: number;
  linear?: number;
  kalman?: number;
};

export type SimulationConfig = {
  duration: number;
  driftPpb: number;
  agingPpbPerHour: number;
  tempSwingNs: number;
  thresholdNs: number;
};

export type ComparisonConfig = {
  duration: number;
  lockDuration: number;
  driftPpb: number;
  agingPpbPerHour: number;
  tempSwingNs: number;
  observationNoiseNs: number;
  seed: number;
};

export type ModelMetric = {
  name: "Baseline" | "Linear prediction" | "Kalman filter";
  rmse: number;
  finalError: number;
  color: string;
};

export const DEFAULT_SIMULATION: SimulationConfig = {
  duration: 1800,
  driftPpb: 4.2,
  agingPpbPerHour: 1.2,
  tempSwingNs: 42,
  thresholdNs: 1000,
};

export const DEFAULT_COMPARISON: ComparisonConfig = {
  duration: 900,
  lockDuration: 120,
  driftPpb: 2.4,
  agingPpbPerHour: 0.8,
  tempSwingNs: 18,
  observationNoiseNs: 8,
  seed: 50721,
};

export function timingErrorNs(
  t: number,
  driftPpb: number,
  agingPpbPerHour: number,
  tempSwingNs: number,
) {
  const linear = driftPpb * t;
  const aging = (0.5 * agingPpbPerHour * t * t) / 3600;
  const thermal = tempSwingNs * Math.sin((2 * Math.PI * t) / 480);
  return linear + aging + thermal;
}

export function generateHoldover(config: SimulationConfig, samples = 181) {
  return Array.from({ length: samples }, (_, index) => {
    const t = (index * config.duration) / (samples - 1);
    return {
      t,
      truth: timingErrorNs(
        t,
        config.driftPpb,
        config.agingPpbPerHour,
        config.tempSwingNs,
      ),
    } satisfies TimingPoint;
  });
}

export function timeToThreshold(
  config: SimulationConfig,
  stepSeconds = 0.25,
) {
  for (let t = 0; t <= config.duration; t += stepSeconds) {
    if (
      Math.abs(
        timingErrorNs(
          t,
          config.driftPpb,
          config.agingPpbPerHour,
          config.tempSwingNs,
        ),
      ) >= config.thresholdNs
    ) {
      return t;
    }
  }
  return null;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number) {
  const a = Math.max(random(), 1e-12);
  const b = random();
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
}

function fitLine(points: Array<{ t: number; y: number }>) {
  const meanT = points.reduce((sum, point) => sum + point.t, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
    numerator += (point.t - meanT) * (point.y - meanY);
    denominator += (point.t - meanT) ** 2;
  }
  const slope = denominator ? numerator / denominator : 0;
  return { slope, intercept: meanY - slope * meanT };
}

export function runComparison(config: ComparisonConfig) {
  const random = mulberry32(config.seed);
  const points: TimingPoint[] = [];
  const observations: Array<{ t: number; y: number }> = [];
  const dt = 1;

  let phase = 0;
  let frequency = 0;
  let p00 = 1000;
  let p01 = 0;
  let p10 = 0;
  let p11 = 100;
  const measurementVariance = config.observationNoiseNs ** 2;
  const processPhase = 0.02;
  const processFrequency = 0.0008;

  for (let t = 0; t <= config.duration; t += dt) {
    const truth = timingErrorNs(
      t,
      config.driftPpb,
      config.agingPpbPerHour,
      config.tempSwingNs,
    );
    const locked = t <= config.lockDuration;
    const observation = locked
      ? truth + gaussian(random) * config.observationNoiseNs
      : undefined;

    phase += frequency * dt;
    const nextP00 = p00 + dt * (p10 + p01) + dt * dt * p11 + processPhase;
    const nextP01 = p01 + dt * p11;
    const nextP10 = p10 + dt * p11;
    const nextP11 = p11 + processFrequency;
    p00 = nextP00;
    p01 = nextP01;
    p10 = nextP10;
    p11 = nextP11;

    if (observation !== undefined) {
      observations.push({ t, y: observation });
      const innovationVariance = p00 + measurementVariance;
      const k0 = p00 / innovationVariance;
      const k1 = p10 / innovationVariance;
      const innovation = observation - phase;
      phase += k0 * innovation;
      frequency += k1 * innovation;
      const oldP00 = p00;
      const oldP01 = p01;
      p00 = (1 - k0) * oldP00;
      p01 = (1 - k0) * oldP01;
      p10 -= k1 * oldP00;
      p11 -= k1 * oldP01;
    }

    points.push({ t, truth, observation, kalman: phase });
  }

  const fitWindow = observations.slice(-60);
  const line = fitLine(fitWindow);
  const lastObservation = observations.at(-1)?.y ?? 0;
  for (const point of points) {
    if (point.t >= config.lockDuration) {
      point.baseline = lastObservation;
      point.linear = line.intercept + line.slope * point.t;
    }
  }

  const holdover = points.filter((point) => point.t > config.lockDuration);
  const metric = (
    name: ModelMetric["name"],
    key: "baseline" | "linear" | "kalman",
    color: string,
  ): ModelMetric => {
    const errors = holdover.map((point) => (point[key] ?? 0) - point.truth);
    return {
      name,
      rmse: Math.sqrt(
        errors.reduce((sum, error) => sum + error * error, 0) / errors.length,
      ),
      finalError: Math.abs(errors.at(-1) ?? 0),
      color,
    };
  };

  return {
    points,
    metrics: [
      metric("Baseline", "baseline", "#8a97a6"),
      metric("Linear prediction", "linear", "#f4a261"),
      metric("Kalman filter", "kalman", "#63e6be"),
    ],
  };
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) return "Not reached";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}
