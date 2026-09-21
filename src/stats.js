// Rolling one-second window of loop metrics, exposed as a plain object the HUD can read.

export function createStats(windowMs = 1000) {
  const snapshot = {
    stepsPerSec: 0, // simulation steps per second
    framesPerSec: 0, // render frames per second
    frameMs: 0, // how long the last frame's own work (simulate + render) took
    deltaMs: 0, // time between the last two frames
    jitterMs: 0, // standard deviation of deltaMs over the last window
    maxDeltaMs: 0, // longest gap between frames in the last window
  };

  let windowStart = null;
  let steps = 0;
  let frames = 0;
  let sum = 0;
  let sumSq = 0;
  let max = 0;

  return {
    snapshot,

    countStep() {
      steps++;
    },

    countFrame(now, deltaMs, workMs) {
      snapshot.frameMs = workMs;
      snapshot.deltaMs = deltaMs;

      if (windowStart === null) {
        windowStart = now; // first frame has no meaningful delta
        return;
      }

      frames++;
      sum += deltaMs;
      sumSq += deltaMs * deltaMs;
      if (deltaMs > max) max = deltaMs;

      const elapsed = now - windowStart;
      if (elapsed >= windowMs) {
        const mean = sum / frames;
        snapshot.stepsPerSec = (steps * 1000) / elapsed;
        snapshot.framesPerSec = (frames * 1000) / elapsed;
        snapshot.jitterMs = Math.sqrt(Math.max(0, sumSq / frames - mean * mean));
        snapshot.maxDeltaMs = max;
        windowStart = now;
        steps = frames = 0;
        sum = sumSq = max = 0;
      }
    },
  };
}
