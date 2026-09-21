import { ARENA, wrap, wrappedDelta } from "../sim/arena.js";
import { angleDelta, lerp } from "../sim/math.js";

/** Lerp along the *shortest* path on a wrapping axis, so crossing an edge doesn't sweep the arena. */
export function lerpWrapped(a, b, t, size) {
  return wrap(a + wrappedDelta(a, b, size) * t, size);
}

/** Lerp along the shortest arc, so crossing ±PI doesn't spin the ship the long way round. */
export function lerpAngle(a, b, t) {
  return a + angleDelta(a, b) * t;
}

/** The state to draw: `t` of the way from the previous simulation state to the current one. */
export function lerpShip(prev, curr, t) {
  return {
    x: lerpWrapped(prev.x, curr.x, t, ARENA.width),
    y: lerpWrapped(prev.y, curr.y, t, ARENA.height),
    angle: lerpAngle(prev.angle, curr.angle, t),
    thrust: curr.thrust,
    vx: lerp(prev.vx, curr.vx, t),
    vy: lerp(prev.vy, curr.vy, t),
  };
}
