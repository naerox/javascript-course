import { createStats } from "./stats.js";

export const STEP = 1 / 60;

/**
 * The accumulator from "Fix Your Timestep!", separated from the browser so it can be tested.
 * `advance(delta, onStep)` runs as many fixed steps as the elapsed time allows and returns
 * how many it ran. `alpha` (in [0,1)) is the leftover fraction of a step.
 */
export function createAccumulator({ step = STEP, maxFrame = 0.25 } = {}) {
  let acc = 0;
  return {
    advance(delta, onStep) {
      // Clamp: after a long hitch (or a hidden tab) do not try to "catch up" for seconds.
      acc += Math.min(Math.max(delta, 0), maxFrame);
      let n = 0;
      while (acc >= step) {
        onStep(step);
        acc -= step;
        n++;
      }
      return n;
    },
    get alpha() {
      return acc / step;
    },
  };
}

/** Default scheduler: call `cb(timestamp)` once per display refresh, right before paint. */
export function rafSchedule(cb) {
  let id = 0;
  const tick = (now) => {
    id = requestAnimationFrame(tick); // re-arm first, so stop() always cancels the pending frame
    cb(now);
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}

/**
 * Fixed-timestep game loop.
 *   simulate(dt) — advances the world by exactly `step` seconds
 *   render(alpha) — draws; alpha in [0,1) says how far we are between the last two states
 */
export function createLoop({
  step = STEP,
  maxFrame = 0.25,
  simulate,
  render,
  schedule = rafSchedule,
}) {
  const stats = createStats();
  const acc = createAccumulator({ step, maxFrame });
  let last = null;
  let cancel = null;

  function frame(now) {
    if (last === null) last = now;
    const delta = (now - last) / 1000;
    last = now;

    const t0 = performance.now();
    acc.advance(delta, (dt) => {
      simulate(dt);
      stats.countStep();
    });
    render(acc.alpha);
    stats.countFrame(now, delta * 1000, performance.now() - t0);
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
