"use client";

import { useMemo, useState } from "react";
import { Clock3, Gauge, Satellite, Waves } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/app-shell";
import { TimingChart } from "@/components/timing-chart";
import {
  DEFAULT_SIMULATION,
  formatDuration,
  generateHoldover,
  timeToThreshold,
} from "@/lib/timing";

function Control({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-3 flex items-center justify-between gap-4 text-sm text-slate-400">
        {label}
        <span className="font-mono font-semibold text-white">
          {value.toLocaleString()} {suffix}
        </span>
      </span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(next[0])}
        aria-label={label}
        className="[&_[data-slot=slider-range]]:bg-emerald-300 [&_[data-slot=slider-thumb]]:border-emerald-300"
      />
    </label>
  );
}

export function SimulationLab() {
  const [config, setConfig] = useState(DEFAULT_SIMULATION);
  const points = useMemo(() => generateHoldover(config), [config]);
  const thresholdTime = useMemo(() => timeToThreshold(config), [config]);
  const finalError = Math.abs(points.at(-1)?.truth ?? 0);
  const margin = Math.max(0, config.thresholdNs - finalError);

  const update = (key: keyof typeof config, value: number) =>
    setConfig((current) => ({ ...current, [key]: value }));

  return (
    <AppShell>
      <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8 lg:py-9">
        <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#63e6be]" />
              Scenario 01 · Free-running holdover
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white md:text-4xl">
              When GNSS disappears, how long does timing stay inside budget?
            </h1>
          </div>
          <button type="button" onClick={() => setConfig(DEFAULT_SIMULATION)} className="w-fit rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white">
            Reset scenario
          </button>
        </section>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="panel p-5 lg:p-6">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Oscillator profile</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">Set deterministic drift after signal loss.</p>
              </div>
              <span className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-2 text-rose-300"><Satellite className="size-4" /></span>
            </div>
            <div className="space-y-7">
              <Control label="Outage duration" value={config.duration} suffix="s" min={300} max={3600} step={60} onChange={(value) => update("duration", value)} />
              <Control label="Frequency offset" value={config.driftPpb} suffix="ppb" min={0.5} max={12} step={0.1} onChange={(value) => update("driftPpb", value)} />
              <Control label="Aging rate" value={config.agingPpbPerHour} suffix="ppb/h" min={0} max={4} step={0.1} onChange={(value) => update("agingPpbPerHour", value)} />
              <Control label="Thermal wander" value={config.tempSwingNs} suffix="ns" min={0} max={120} step={2} onChange={(value) => update("tempSwingNs", value)} />
              <Control label="Error threshold" value={config.thresholdNs} suffix="ns" min={100} max={3000} step={50} onChange={(value) => update("thresholdNs", value)} />
            </div>
          </aside>

          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric icon={Clock3} label="Time to threshold" value={formatDuration(thresholdTime)} accent={thresholdTime === null ? "safe" : "warn"} />
              <Metric icon={Gauge} label="Final phase error" value={`${Math.round(finalError).toLocaleString()} ns`} />
              <Metric icon={Waves} label="Remaining margin" value={`${Math.round(margin).toLocaleString()} ns`} accent={margin > 0 ? "safe" : "warn"} />
            </div>

            <div className="panel p-5 lg:p-7">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">Phase error after GNSS loss</p>
                  <p className="mt-1 text-sm text-slate-500">Deterministic oscillator model · nanoseconds versus elapsed time</p>
                </div>
                <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-xs text-slate-400">t₀ = signal loss</span>
              </div>
              <TimingChart points={points} series={[{ key: "truth", label: "Oscillator phase error", color: "#63e6be" }]} threshold={config.thresholdNs} />
            </div>
          </section>
        </div>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="panel p-5 lg:p-6">
            <p className="text-sm font-semibold text-white">What the model includes</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Constant fractional frequency offset, linear aging, and bounded sinusoidal thermal wander. The threshold is evaluated against absolute phase error.</p>
          </div>
          <div className="panel p-5 lg:p-6">
            <p className="text-sm font-semibold text-white">Interpretation</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">This is a reproducible lab model, not a hardware qualification result. Real holdover also depends on temperature history, oscillator calibration, servo design, and device-specific noise.</p>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  accent?: "safe" | "warn";
}) {
  const color = accent === "safe" ? "text-emerald-300" : accent === "warn" ? "text-amber-300" : "text-white";
  return (
    <article className="panel p-5">
      <div className="mb-4 flex items-center justify-between text-slate-500">
        <span className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</span>
        <Icon className="size-4" />
      </div>
      <p className={`font-mono text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
    </article>
  );
}
