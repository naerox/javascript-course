import "./style.css";
import { createLoop, rafSchedule } from "./loop.js";
import { createInput, readControls } from "./input.js";
import { createShip, integrate } from "./sim/ship.js";
import { setupCanvas } from "./render/canvas.js";
import { lerpShip } from "./render/interpolate.js";
import { drawBackground, drawHud, drawShip } from "./render/draw.js";
import { busyWait, createVariableLoop, getExperiment, intervalSchedule } from "./experiments.js";

const exp = getExperiment();
const view = setupCanvas(document.querySelector("#game"));
const input = createInput(window);

// The simulation keeps two states: the previous step and the current one. The renderer blends them.
let previous = createShip();
let current = previous;
let ticks = 0;

// Scripted run (key T): fixed inputs for exactly 5 s of *simulated* time, so runs can be compared
// across machines and CPU throttling (experiment 3).
const RUN_SECONDS = 5;
let run = null;
let lastRun = null;

function startRun() {
  previous = current = createShip();
  run = { time: 0 };
}

function simulate(dt) {
  if (input.justPressed("KeyR")) {
    previous = current = createShip();
    run = null;
  }
  if (input.justPressed("KeyT")) startRun();

  previous = current;
  ticks++;

  if (run) {
    const stepDt = Math.min(dt, RUN_SECONDS - run.time); // land exactly on 5.000 s
    current = integrate(current, { turn: run.time < 1 ? 1 : 0, thrust: true }, stepDt);
    run.time += stepDt;
    if (RUN_SECONDS - run.time < 1e-9) {
      lastRun = { x: current.x, y: current.y, vx: current.vx, vy: current.vy };
      console.log(`[${exp.name}] after ${RUN_SECONDS}s`, {
        x: current.x.toFixed(4),
        y: current.y.toFixed(4),
        angle: current.angle.toFixed(4),
      });
      run = null;
    }
  } else {
    current = integrate(current, readControls(input), dt);
  }

  input.endStep();
}

let frameNo = 0;
function render(alpha) {
  frameNo++;
  if (exp.block && frameNo % 60 === 0) busyWait(100); // experiment 1

  drawBackground(view);
  drawShip(view, lerpShip(previous, current, alpha));
  drawHud(view, loop.stats, [
    `mode      ${exp.name}`,
    `tick      ${ticks}   alpha ${alpha.toFixed(2)}`,
    ...(run ? [`run       ${run.time.toFixed(2)} / ${RUN_SECONDS} s`] : []),
    ...(lastRun ? [`last run  x ${lastRun.x.toFixed(2)}  y ${lastRun.y.toFixed(2)}`] : []),
  ]);
}

const hooks = { simulate, render };
const loop = exp.variable
  ? createVariableLoop(hooks)
  : createLoop({ ...hooks, schedule: exp.interval ? intervalSchedule(16) : rafSchedule });

loop.start();
