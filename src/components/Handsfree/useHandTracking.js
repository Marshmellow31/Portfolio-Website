import { useEffect, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Landmark index pairs for the hand-skeleton overlay
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index
  [5, 9], [9, 10], [10, 11], [11, 12],  // middle
  [9, 13], [13, 14], [14, 15], [15, 16],// ring
  [13, 17], [17, 18], [18, 19], [19, 20],// pinky
  [0, 17],
];

// Pinch = thumb-tip↔index-tip distance measured RELATIVE to hand size
// (wrist→middle-finger-MCP). Absolute normalized-coordinate thresholds only
// work at one specific distance from the camera; a ratio works at any range.
// Hysteresis: pinch ON below 0.35× hand size, OFF above 0.5×.
const PINCH_ON_RATIO = 0.35;
const PINCH_OFF_RATIO = 0.5;
const CLICK_MAX_MS = 250;
const CLICK_MAX_MOVE = 20;
const SCROLL_GAIN = 2.5;
const MOMENTUM_DECAY = 0.92;

// Wrist + finger bases: stable palm centroid for the cursor
const PALM_ANCHORS = [0, 5, 9, 13, 17];

const centroidOf = (lm) => {
  let x = 0, y = 0;
  for (const i of PALM_ANCHORS) { x += lm[i].x; y += lm[i].y; }
  return { x: x / PALM_ANCHORS.length, y: y / PALM_ANCHORS.length };
};

/**
 * Owns the webcam stream, the MediaPipe HandLandmarker, and the rAF gesture
 * loop. Moves `cursorRef` imperatively (no per-frame React state) and draws
 * the skeleton overlay onto `canvasRef`.
 */
export default function useHandTracking({ enabled, videoRef, canvasRef, cursorRef, onAutoStop }) {
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let stream = null;
    let landmarker = null;
    let rafId = 0;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Reduced motion: no spring/lerp smoothing, cursor tracks directly
    const lerpFactor = reducedMotion ? 1 : 0.25;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };
    let hasHand = false;
    let lastVideoTime = -1;
    let lastResult = null;
    let lastCentroid = null;

    let pinched = false;
    let pinchStartTime = 0;
    let pinchStartPos = { x: 0, y: 0 };
    let lastPinchY = 0;
    let scrolling = false;
    let scrollVelocity = 0;
    let momentum = 0;

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const stopAll = () => {
      cancelAnimationFrame(rafId);
      stopStream();
      if (landmarker) {
        landmarker.close();
        landmarker = null;
      }
    };

    const syntheticClick = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return;
      el.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
      }));
      // Brief visual pulse on the robot cursor
      const cursor = cursorRef.current;
      if (cursor && !reducedMotion) {
        cursor.style.scale = '0.8';
        setTimeout(() => { if (cursor) cursor.style.scale = '1'; }, 150);
      }
    };

    // Draws every detected hand: the tracked one in accent, others dimmed.
    // The thumb↔index line doubles as live pinch feedback.
    const drawOverlay = (hands, activeIndex, isPinched) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      // Mirror x so the overlay matches the mirrored preview
      const px = (p) => (1 - p.x) * width;
      const py = (p) => p.y * height;

      hands.forEach((landmarks, i) => {
        const isActive = i === activeIndex;
        ctx.strokeStyle = isActive ? 'rgba(255, 0, 127, 0.9)' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        for (const [a, b] of CONNECTIONS) {
          ctx.beginPath();
          ctx.moveTo(px(landmarks[a]), py(landmarks[a]));
          ctx.lineTo(px(landmarks[b]), py(landmarks[b]));
          ctx.stroke();
        }
        ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        for (const p of landmarks) {
          ctx.beginPath();
          ctx.arc(px(p), py(p), 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (isActive) {
          ctx.strokeStyle = isPinched ? '#ff007f' : 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = isPinched ? 3 : 1;
          ctx.beginPath();
          ctx.moveTo(px(landmarks[4]), py(landmarks[4]));
          ctx.lineTo(px(landmarks[8]), py(landmarks[8]));
          ctx.stroke();
        }
      });
    };

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || !landmarker || video.readyState < 2) return;

      const now = performance.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        lastResult = landmarker.detectForVideo(video, now);
      }
      const hands = lastResult?.landmarks || [];

      // With two hands in frame, keep following the hand we already track
      // (nearest centroid to last frame) so the cursor doesn't jump between them
      let activeIndex = -1;
      if (hands.length === 1) {
        activeIndex = 0;
      } else if (hands.length > 1) {
        if (lastCentroid) {
          let best = Infinity;
          hands.forEach((lm, i) => {
            const c = centroidOf(lm);
            const d = Math.hypot(c.x - lastCentroid.x, c.y - lastCentroid.y);
            if (d < best) { best = d; activeIndex = i; }
          });
        } else {
          activeIndex = 0;
        }
      }
      const landmarks = activeIndex >= 0 ? hands[activeIndex] : null;

      if (landmarks) {
        hasHand = true;
        const c = centroidOf(landmarks);
        lastCentroid = c;
        target.x = (1 - c.x) * window.innerWidth; // mirrored x
        target.y = c.y * window.innerHeight;
      } else {
        hasHand = false;
        lastCentroid = null;
      }

      // Lerp smoothing
      pos.x += (target.x - pos.x) * lerpFactor;
      pos.y += (target.y - pos.y) * lerpFactor;

      // ── Pinch detection with hysteresis, scaled to hand size ──
      if (landmarks) {
        const handScale = Math.hypot(
          landmarks[0].x - landmarks[9].x,
          landmarks[0].y - landmarks[9].y,
        ) || 1e-6;
        const pinchRatio = Math.hypot(
          landmarks[4].x - landmarks[8].x,
          landmarks[4].y - landmarks[8].y,
        ) / handScale;

        if (!pinched && pinchRatio < PINCH_ON_RATIO) {
          pinched = true;
          pinchStartTime = now;
          pinchStartPos = { x: pos.x, y: pos.y };
          lastPinchY = pos.y;
          scrolling = false;
          momentum = 0;
        } else if (pinched && pinchRatio > PINCH_OFF_RATIO) {
          pinched = false;
          const duration = now - pinchStartTime;
          const moved = Math.hypot(pos.x - pinchStartPos.x, pos.y - pinchStartPos.y);
          if (!scrolling && duration < CLICK_MAX_MS && moved < CLICK_MAX_MOVE) {
            syntheticClick(pos.x, pos.y);
          } else if (scrolling) {
            momentum = scrollVelocity;
          }
          scrolling = false;
        }

        if (pinched && !scrolling) {
          // Scroll engages on a held pinch OR an immediate drag
          const heldLong = now - pinchStartTime > CLICK_MAX_MS;
          const movedFar = Math.hypot(pos.x - pinchStartPos.x, pos.y - pinchStartPos.y) > CLICK_MAX_MOVE;
          if (heldLong || movedFar) scrolling = true;
        }
        if (pinched && scrolling) {
          // Drag to scroll: content follows the hand. behavior: 'instant' is
          // required — the site sets `html { scroll-behavior: smooth }`, which
          // turns each default scrollBy into an animation that the next
          // frame's call cancels, so per-frame scrolling never moves the page.
          const dy = pos.y - lastPinchY;
          scrollVelocity = -dy * SCROLL_GAIN;
          if (Math.abs(dy) > 0.5) window.scrollBy({ top: scrollVelocity, behavior: 'instant' });
        }
        if (pinched) lastPinchY = pos.y;
      } else if (pinched) {
        // Hand lost mid-pinch: release without click
        pinched = false;
        scrolling = false;
      }

      drawOverlay(hands, activeIndex, pinched);

      const cursor = cursorRef.current;
      if (cursor) {
        cursor.style.transform = `translate(${pos.x - 24}px, ${pos.y - 24}px)`;
        cursor.style.opacity = hasHand ? '1' : '0';
        // Fill the face while pinching so gesture state is always visible
        const face = cursor.firstElementChild;
        if (face) face.style.background = pinched ? 'rgba(255, 0, 127, 0.7)' : 'rgba(255, 0, 127, 0.25)';
      }

      // ── Scroll momentum after release ──
      if (!pinched && Math.abs(momentum) > 0.5) {
        window.scrollBy({ top: momentum, behavior: 'instant' });
        momentum *= MOMENTUM_DECAY;
      }
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
      } catch {
        if (!cancelled) setError('Camera access denied — Handsfree unavailable');
        return;
      }
      if (cancelled) {
        stopStream();
        return;
      }

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      } catch {
        if (!cancelled) setError('Failed to load the hand-tracking model — Handsfree unavailable');
        stopStream();
        return;
      }
      if (cancelled) {
        stopAll();
        return;
      }

      setReady(true);
      rafId = requestAnimationFrame(loop);
    };

    // Kill the camera when the tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        stopAll();
        onAutoStop?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    start();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      stopAll();
    };
    // videoRef/canvasRef/cursorRef are stable ref objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { error, ready };
}
