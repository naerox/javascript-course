import { ARENA } from "../sim/arena.js";
import { beginScreen, beginWorld } from "./canvas.js";

const COLORS = {
  letterbox: "#070d13",
  sky: "#0e1b26",
  gridMinor: "#15283a",
  gridMajor: "#22405a",
  border: "#3a6a8c",
  fuselage: "#e9dcc0",
  wing: "#c8553d",
  flame: "#ffb84d",
  hud: "#9fc3d8",
  hudWarn: "#ff7a59",
};

const GRID = 100;
const SHIP_RADIUS = 30;
const FRAME_BUDGET_MS = 1000 / 60;

export function drawBackground(view) {
  const { ctx } = view;

  beginScreen(view);
  ctx.fillStyle = COLORS.letterbox;
  ctx.fillRect(0, 0, view.width, view.height);

  beginWorld(view);
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);

  // Grid: the only thing that makes motion visible when the whole arena fits on screen.
  ctx.lineWidth = 1 / view.scale; // hairline in screen pixels, whatever the scale
  for (let x = 0; x <= ARENA.width; x += GRID) {
    ctx.strokeStyle = x % (GRID * 4) === 0 ? COLORS.gridMajor : COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ARENA.height; y += GRID) {
    ctx.strokeStyle = y % (GRID * 4) === 0 ? COLORS.gridMajor : COLORS.gridMinor;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2 / view.scale;
  ctx.strokeRect(0, 0, ARENA.width, ARENA.height);
}

/** Draws a top-down biplane at the origin, pointing right; the caller translates/rotates. */
function drawBiplane(ctx, thrusting, flicker) {
  if (thrusting) {
    ctx.fillStyle = COLORS.flame;
    ctx.beginPath();
    ctx.moveTo(-22, -4);
    ctx.lineTo(-22 - 22 * flicker, 0);
    ctx.lineTo(-22, 4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = COLORS.wing; // wings: spread across the heading
  ctx.fillRect(-4, -24, 13, 48);
  ctx.fillRect(-24, -10, 6, 20); // tailplane

  ctx.fillStyle = COLORS.fuselage; // fuselage
  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.lineTo(8, -6);
  ctx.lineTo(-22, -3);
  ctx.lineTo(-22, 3);
  ctx.lineTo(8, 6);
  ctx.closePath();
  ctx.fill();
}

/**
 * `ship` is the already-interpolated state. Near an edge the ship is also drawn on the opposite
 * side, so wrap-around looks continuous instead of the ship popping across the arena.
 */
export function drawShip(view, ship) {
  const { ctx } = view;
  const flicker = 0.75 + 0.25 * Math.sin(performance.now() / 40); // render-only, not simulation

  beginWorld(view);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ARENA.width, ARENA.height); // don't draw ghosts into the letterbox
  ctx.clip();

  for (const dx of [-ARENA.width, 0, ARENA.width]) {
    for (const dy of [-ARENA.height, 0, ARENA.height]) {
      const x = ship.x + dx;
      const y = ship.y + dy;
      if (x < -SHIP_RADIUS || x > ARENA.width + SHIP_RADIUS) continue;
      if (y < -SHIP_RADIUS || y > ARENA.height + SHIP_RADIUS) continue;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ship.angle);
      drawBiplane(ctx, ship.thrust, flicker);
      ctx.restore();
    }
  }
  ctx.restore();
}

export function drawHud(view, stats, lines = []) {
  const { ctx } = view;
  beginScreen(view);
  ctx.font = '13px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  ctx.textBaseline = "top";

  const rows = [
    `steps/s   ${stats.stepsPerSec.toFixed(0)}`,
    `frames/s  ${stats.framesPerSec.toFixed(0)}`,
    `frame     ${stats.frameMs.toFixed(2)} ms`,
    `delta     ${stats.deltaMs.toFixed(1)} ms   max ${stats.maxDeltaMs.toFixed(1)}`,
    `jitter    ${stats.jitterMs.toFixed(2)} ms`,
    ...lines,
  ];

  rows.forEach((text, i) => {
    ctx.fillStyle =
      text.startsWith("delta") && stats.deltaMs > FRAME_BUDGET_MS * 1.5
        ? COLORS.hudWarn
        : COLORS.hud;
    ctx.fillText(text, 12, 10 + i * 17);
  });

  ctx.fillStyle = COLORS.hud;
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "←/→ або A/D — поворот   ↑ або W — тяга   R — скинути   T — скрипт 5 с",
    12,
    view.height - 10,
  );
}
