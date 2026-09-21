import test from "node:test";
import assert from "node:assert/strict";
import { lerpAngle, lerpShip, lerpWrapped } from "./interpolate.js";
import { ARENA } from "../sim/arena.js";

test("lerpAngle crosses ±PI the short way", () => {
  const mid = lerpAngle(3.1, -3.1, 0.5); // shortest arc passes through PI, not through 0
  assert.ok(Math.abs(Math.abs(mid) - Math.PI) < 0.05, `mid = ${mid}`);
});

test("lerpWrapped crosses an arena edge without sweeping the arena", () => {
  const x = lerpWrapped(1598, 2, 0.5, ARENA.width); // 4 units apart across the edge
  assert.ok(x < 2 || x > 1598, `x = ${x}`);
});

test("lerpShip at t=0 and t=1 returns the endpoints", () => {
  const a = { x: 10, y: 20, vx: 0, vy: 0, angle: 0.5, thrust: false };
  const b = { x: 14, y: 26, vx: 1, vy: 1, angle: 0.7, thrust: true };
  assert.equal(lerpShip(a, b, 0).x, 10);
  assert.ok(Math.abs(lerpShip(a, b, 1).y - 26) < 1e-9);
});
