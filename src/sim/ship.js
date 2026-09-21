import { ARENA, wrap } from "./arena.js";
import { wrapAngle } from "./math.js";

// Units: world units and seconds. Angle 0 points right, -PI/2 points up (canvas y grows down).
export const SHIP_PARAMS = Object.freeze({
  turnRate: 3.6, // rad/s at full turn input
  thrust: 320, // acceleration, units/s²
  drag: 0.7, // 1/s, exponential velocity decay (independent of dt)
  maxSpeed: 420, // units/s
});

/** A ship is plain data: no methods, no hidden state. */
export function createShip(x = ARENA.width / 2, y = ARENA.height / 2) {
  return { x, y, vx: 0, vy: 0, angle: -Math.PI / 2, thrust: false };
}

/**
 * One simulation step. Pure: the same (ship, controls, dt) always gives the same result,
 * `ship` is never mutated, and nothing here touches the DOM.
 *
 * controls = { turn: -1 | 0 | 1, thrust: boolean }
 */
export function integrate(ship, controls, dt, params = SHIP_PARAMS) {
  const angle = wrapAngle(ship.angle + controls.turn * params.turnRate * dt);

  let vx = ship.vx;
  let vy = ship.vy;
  if (controls.thrust) {
    vx += Math.cos(angle) * params.thrust * dt;
    vy += Math.sin(angle) * params.thrust * dt;
  }

  // Exponential drag: v *= e^(-k·dt) gives the same decay however dt is sliced.
  const damping = Math.exp(-params.drag * dt);
  vx *= damping;
  vy *= damping;

  const speed = Math.hypot(vx, vy);
  if (speed > params.maxSpeed) {
    const k = params.maxSpeed / speed;
    vx *= k;
    vy *= k;
  }

  return {
    x: wrap(ship.x + vx * dt, ARENA.width),
    y: wrap(ship.y + vy * dt, ARENA.height),
    vx,
    vy,
    angle,
    thrust: controls.thrust,
  };
}
