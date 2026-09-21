import { ARENA } from "../sim/arena.js";

/**
 * DPR-aware canvas. The backing store is cssSize × devicePixelRatio physical pixels, so lines
 * are crisp on retina screens. The arena (1600×900 world units) is scaled to fit the window
 * and centred (letterboxed), so the simulation never depends on window size.
 */
export function setupCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const view = { ctx, width: 0, height: 0, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    // Assigning width/height also resets the context state — that's why transforms are
    // re-applied every frame (beginWorld/beginScreen) instead of being set once here.
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const scale = Math.min(width / ARENA.width, height / ARENA.height);
    Object.assign(view, {
      width,
      height,
      dpr,
      scale,
      offsetX: (width - ARENA.width * scale) / 2,
      offsetY: (height - ARENA.height * scale) / 2,
    });
  }

  new ResizeObserver(resize).observe(canvas);
  window.addEventListener("resize", resize); // also fires on browser zoom, which changes DPR
  resize();
  return view;
}

/** Draw in world units: (0,0) is the arena's top-left corner. */
export function beginWorld(view) {
  const { ctx, dpr, scale, offsetX, offsetY } = view;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

/** Draw in CSS pixels (for the HUD). */
export function beginScreen(view) {
  const { ctx, dpr } = view;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
