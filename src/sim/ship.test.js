import test from "node:test";
import assert from "node:assert/strict";
import { createShip, integrate, SHIP_PARAMS } from "./ship.js";
import { ARENA, wrap } from "./arena.js";
import { angleDelta } from "./math.js";

const STEP = 1 / 60;
const hold = { turn: 0, thrust: true };

function run(ship, controls, dt, steps) {
  for (let i = 0; i < steps; i++) ship = integrate(ship, controls, dt);
  return ship;
}

test("integrate is pure: it does not mutate its input", () => {
  const ship = createShip();
  const frozen = Object.freeze({ ...ship });
  assert.doesNotThrow(() => integrate(frozen, hold, STEP));
  assert.deepEqual(ship, createShip());
});

test("integrate is deterministic", () => {
  const a = run(createShip(), { turn: 1, thrust: true }, STEP, 300);
  const b = run(createShip(), { turn: 1, thrust: true }, STEP, 300);
  assert.deepEqual(a, b);
});

test("speed never exceeds maxSpeed", () => {
  let ship = createShip();
  for (let i = 0; i < 1000; i++) {
    ship = integrate(ship, hold, STEP);
    assert.ok(Math.hypot(ship.vx, ship.vy) <= SHIP_PARAMS.maxSpeed + 1e-9);
  }
});

test("drag slows a coasting ship down", () => {
  const fast = { ...createShip(), vx: 300 };
  const later = run(fast, { turn: 0, thrust: false }, STEP, 120);
  assert.ok(later.vx < 300 && later.vx > 0);
});

test("wrap-around keeps the ship inside the arena", () => {
  const ship = { ...createShip(ARENA.width - 1, 1), vx: 200, vy: -200 };
  const next = integrate(ship, { turn: 0, thrust: false }, STEP);
  assert.ok(next.x >= 0 && next.x < 20, `x = ${next.x}`);
  assert.ok(next.y > ARENA.height - 20 && next.y < ARENA.height, `y = ${next.y}`);
  assert.equal(wrap(-1, 10), 9);
});

test("angle stays normalised and angleDelta takes the short way round", () => {
  const ship = run(createShip(), { turn: 1, thrust: false }, STEP, 600);
  assert.ok(ship.angle >= -Math.PI && ship.angle < Math.PI);
  assert.ok(Math.abs(angleDelta(3.1, -3.1) - (2 * Math.PI - 6.2)) < 1e-9);
});

test("a variable timestep changes the trajectory; the fixed step does not", () => {
  const controls = { turn: 0, thrust: true };
  const fixed = run(createShip(400, 450), controls, 1 / 60, 300); // 5 s at 60 Hz
  const coarse = run(createShip(400, 450), controls, 1 / 10, 50); // 5 s at 10 Hz
  const same = run(createShip(400, 450), controls, 1 / 60, 300);
  const gap = Math.hypot(fixed.x - coarse.x, fixed.y - coarse.y);
  console.log(`  5 s of thrust: 60 Hz vs 10 Hz ends ${gap.toFixed(2)} units apart`);
  assert.ok(gap > 1, "different dt should give a visibly different result");
  assert.deepEqual(fixed, same);
});
