"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, RefreshCw, Sigma } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TimingChart } from "@/components/timing-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_COMPARISON, runComparison } from "@/lib/timing";

export function ComparisonLab() {
  const [config, setConfig] = useState(DEFAULT_COMPARISON);
  const result = useMemo(() => runComparison(config), [config]);
  const winner = [...result.metrics].sort((a, b) => a.rmse - b.rmse)[0];

  return (
    <AppShell>
      <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8 lg:py-9">
        <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#d2fc63]">
              <span className="size-1.5 rounded-full bg-[#d2fc63] shadow-[0_0_12px_#d2fc63]" />
              Scenario 02 · Prediction benchmark
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white md:text-4xl">
              Same observations. Three holdover strategies.
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <RefreshCw className="size-4" />
            Seeded and repeatable
          </div>
        </section>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
          <article className="panel flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Lowest RMSE</p>
              <p className="mt-2 text-xl font-semibold text-white">{winner.name}</p>
            </div>
            <span className="grid size-11 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><BrainCircuit className="size-5" /></span>
          </article>
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Training window</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-white">0–{config.lockDuration}s</p>
          </article>
          <article className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Holdover window</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-white">{config.duration - config.lockDuration}s</p>
          </article>
        </div>

        <section className="panel mb-5 p-5 lg:p-7">
          <div className="mb-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-end">
            <div>
              <p className="font-semibold text-white">Prediction error after signal loss</p>
              <p className="mt-1 text-sm text-slate-500">Synthetic GNSS phase observations stop at t = {config.lockDuration}s</p>
            </div>
            <label>
              <span className="mb-2 flex items-center justify-between text-sm text-slate-400">
                Observation noise
                <span className="font-mono font-semibold text-white">{config.observationNoiseNs} ns σ</span>
              </span>
              <Slider
                value={[config.observationNoiseNs]}
                min={1}
                max={30}
                step={1}
                onValueChange={(value) => setConfig((current) => ({ ...current, observationNoiseNs: value[0] }))}
                aria-label="Observation noise"
                className="[&_[data-slot=slider-range]]:bg-[#d2fc63] [&_[data-slot=slider-thumb]]:border-[#d2fc63]"
              />
            </label>
          </div>
          <TimingChart
            points={result.points}
            outageAt={config.lockDuration}
            series={[
              { key: "truth", label: "Ground truth", color: "#ffffff" },
              { key: "baseline", label: "Baseline", color: "#8a97a6", dashed: true },
              { key: "linear", label: "Linear", color: "#f4a261" },
              { key: "kalman", label: "Kalman", color: "#63e6be" },
            ]}
          />
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="panel overflow-hidden">
            <div className="border-b border-white/10 px-5 py-4 lg:px-6">
              <p className="font-semibold text-white">Holdover scorecard</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-white/10 bg-black/10 text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Model</th>
                    <th className="px-6 py-3 font-medium">RMSE</th>
                    <th className="px-6 py-3 font-medium">Final |error|</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {result.metrics.map((metric) => (
                    <tr key={metric.name} className="text-slate-300">
                      <td className="px-6 py-4 font-semibold text-white">
                        <span className="mr-3 inline-block size-2 rounded-full" style={{ backgroundColor: metric.color }} />
                        {metric.name}
                      </td>
                      <td className="px-6 py-4 font-mono">{metric.rmse.toFixed(1)} ns</td>
                      <td className="px-6 py-4 font-mono">{metric.finalError.toFixed(1)} ns</td>
                      <td className="px-6 py-4 text-slate-500">{methodLabel(metric.name)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="panel p-5 lg:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-slate-300"><Sigma className="size-4" /></span>
              <div>
                <p className="text-sm font-semibold text-white">Dataset controls</p>
                <p className="text-xs text-slate-500">Same seed, same observations</p>
              </div>
            </div>
            <label className="text-sm text-slate-400" htmlFor="seed">Random seed</label>
            <Input
              id="seed"
              type="number"
              value={config.seed}
              onChange={(event) => setConfig((current) => ({ ...current, seed: Number(event.target.value) || 1 }))}
              className="mt-2 border-white/10 bg-black/20 font-mono text-white"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfig((current) => ({ ...current, seed: current.seed + 1 }))}
              className="mt-3 w-full border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08] hover:text-white"
            >
              <RefreshCw className="size-4" />
              Use next seed
            </Button>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm font-semibold text-white">Assumptions</p>
              <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-400">
                <li>• 1 Hz observations with zero-mean Gaussian noise.</li>
                <li>• Linear uses the final 60 locked samples.</li>
                <li>• Kalman state is phase + frequency with fixed Q/R.</li>
                <li>• No GNSS updates occur during holdover.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function methodLabel(name: string) {
  if (name === "Baseline") return "Last observation held";
  if (name === "Linear prediction") return "Least-squares trend";
  return "2-state phase/frequency filter";
}
