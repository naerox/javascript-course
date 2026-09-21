// Deliberately broken variants for the "break it on purpose, then measure" part of the lab.
// Enable one via the URL: ?exp=block | ?exp=interval | ?exp=variable

import { rafSchedule } from "./loop.js";
import { createStats } from "./stats.js";

export function getExperiment(search = window.location.search) {
  const name = new URLSearchParams(search).get("exp") ?? "baseline";
  return {
    name,
    block: name === "block",
    interval: name === "interval",
    variable: name === "variable",
  };
}

/** Experiment 1: a synchronous busy-wait. Nothing else on the page can run while it spins. */
export function busyWait(ms) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* spin */
  }
}

/** Experiment 2: setInterval instead of requestAnimationFrame. */
export function intervalSchedule(ms = 16) {
  return (cb) => {
    const id = setInterval(() => cb(performance.now()), ms);
    return () => clearInterval(id);
  };
}

/** Experiment 3: no accumulator — one simulate(realDelta) per frame, unclamped. */
export function createVariableLoop({ simulate, render, schedule = rafSchedule }) {
  const stats = createStats();
  let last = null;
  let cancel = null;

  function frame(now) {
    if (last === null) last = now;
    const dt = (now - last) / 1000;
    last = now;

    const t0 = performance.now();
    simulate(dt);
    stats.countStep();
    render(1); // no leftover time to interpolate over
    stats.countFrame(now, dt * 1000, performance.now() - t0);
  }

  return {
    stats: stats.snapshot,
    start() {
      if (cancel) return;
      last = null;
      cancel = schedule(frame);
    },
    stop() {
      cancel?.();
      cancel = null;
    },
  };
}
