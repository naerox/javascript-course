/**
 * Keyboard state as a closure: `down` and `pressed` are private, the returned object is the API.
 * We use `event.code` (physical key), so WASD works on any keyboard layout, including Ukrainian.
 */
export function createInput(target = window) {
  const down = new Set(); // keys currently held
  const pressed = new Set(); // keys that went down since the last simulation step
  const ac = new AbortController();
  const opts = { signal: ac.signal };

  const GAME_KEYS = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Space",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
  ]);

  target.addEventListener(
    "keydown",
    (e) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault(); // stop arrows/space from scrolling the page
      if (e.repeat) return; // auto-repeat is not a new press
      down.add(e.code);
      pressed.add(e.code);
    },
    opts,
  );
  target.addEventListener("keyup", (e) => down.delete(e.code), opts);
  // If the window loses focus, keyup never arrives — release everything or the ship "sticks".
  target.addEventListener("blur", () => down.clear(), opts);

  return {
    isDown: (code) => down.has(code),

    /**
     * True if the key went down since the last `endStep()`. Edge-triggered *per simulation step*,
     * not per frame: a frame may run 0 or several steps, and a quick tap must never be lost.
     */
    justPressed: (code) => pressed.has(code),

    /** Call once after every simulation step. */
    endStep: () => pressed.clear(),

    dispose: () => ac.abort(),
  };
}

/** Translates raw keys into the plain controls object the simulation understands. */
export function readControls(input) {
  const left = input.isDown("ArrowLeft") || input.isDown("KeyA");
  const right = input.isDown("ArrowRight") || input.isDown("KeyD");
  const thrust = input.isDown("ArrowUp") || input.isDown("KeyW");
  return { turn: (right ? 1 : 0) - (left ? 1 : 0), thrust };
}
