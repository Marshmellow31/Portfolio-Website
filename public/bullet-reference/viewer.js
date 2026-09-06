/* Local adapter for the publicly hosted Royal Enfield InfinityRT scene. */
/* global infinityrt_getwebglcontext, infinityrt_scene, infinityrt_navigation */
const canvas = document.getElementById('viewer');
const statusElement = document.getElementById('status');
const progressElement = document.getElementById('progress');
const goldButton = document.getElementById('gold');
const standardButton = document.getElementById('standard');
const buttons = [goldButton, standardButton];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointers = new Map();
let frame = 0, scene, ready = false, stopped = false, failed = false, heroVisible = true;
let previousTime = performance.now(), pauseRotationUntil = 0;
const restTilt = .22;
// The showroom scene is authored around a point behind the motorcycle because
// the rear display stand is included. Move the orbit target forward so the
// engine, rather than the stand, reads as the physical centre of rotation.
const engineOrbitTarget = [0, 0, 5];
const fail = message => {
  failed = true;
  cancelAnimationFrame(frame);
  statusElement.style.display = 'grid';
  statusElement.textContent = message;
};
window.addEventListener('error', e => {
  console.warn('[Bullet Reference Error]:', e.message || e);
});
function resetView(keepRotation = false) {
  // Hide the showroom hierarchy while retaining its environment lighting.
  scene.instanceSet('P3F4_Room_3D_0001', 'visible', 0);
  scene.setBackgroundTransparent(true);
  scene._nav._navDXAng = 0;
  scene._nav._navDYAng = 0;

  const w = innerWidth;
  const isMobile = w < 768;

  // In InfinityRT, POSITIVE dolly increases camera distance (zooms out).
  // On mobile portrait, the narrow aspect ratio compresses horizontal FOV.
  // Using positive dolly (+120 to +135) pulls the camera back so that the full
  // 2.2m motorcycle (both wheels, handlebars, exhaust tip) fits comfortably
  // with generous 15-20% clearance even when rotated 100% sideways.
  let mobileDolly = 120;
  if (w < 400) {
    mobileDolly = 135;
  } else if (w < 600) {
    mobileDolly = 120;
  } else if (w < 768) {
    mobileDolly = 80;
  }

  const targetDolly = isMobile ? mobileDolly : 0;
  // Desktop: [-28, 12] positions model in bottom-right quadrant to balance left text
  // Mobile: [0, 2.2] centers model above bottom controls
  const targetPan = isMobile ? [0, 2.2] : [-28, 12];

  scene._nav._panMin = [-200.0, -200.0];
  scene._nav._panMax = [200.0, 200.0];
  scene._nav._navMaxDolly = 500.0;
  scene._nav._navMaxDollyOriginal = 500.0;
  scene._nav._navMinDolly = -120.0;
  scene._nav._navMinDollyOriginal = -120.0;

  Object.assign(scene._nav, {
    _navGotoPosActive: false,
    _navXAng: restTilt,
    _navYAng: (keepRotation && scene._nav) ? scene._nav._navYAng : 5.71,
    _navDolly: targetDolly,
    _navDDolly: 0,
    _navPan: targetPan,
    _navDPan: [0, 0],
    _navTarget: engineOrbitTarget.slice(),
    _navChange: true
  });
  scene.clearRefine();
}
function finish(name) {
  scene.groupApplyState(`color_vis:${name}`, undefined, resetView);
  goldButton.setAttribute('aria-pressed', String(name === 'premium'));
  standardButton.setAttribute('aria-pressed', String(name === 'black'));
  if (parent !== window) {
    parent.postMessage({ type: 'bullet-finish-changed', finish: name }, location.origin);
  }
}

// Ensure GetUnmaskedRenderer never returns software strings that cause InfinityRT to abort
if (typeof window.GetUnmaskedRenderer === 'function') {
  const _origGetUnmasked = window.GetUnmaskedRenderer;
  window.GetUnmaskedRenderer = function(ctx) {
    try {
      const name = _origGetUnmasked(ctx);
      if (typeof name === 'string' && name) {
        return name.replace(/SwiftShader|Microsoft Basic Render Driver|llvmpipe/gi, 'Generic GPU');
      }
    } catch {}
    return 'Generic GPU';
  };
}

// Ensure infinityrt_webgl2avail never crashes on null context or disabled hardware acceleration
window.infinityrt_webgl2avail = function() {
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && testCanvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }));
  } catch {
    return false;
  }
};

// Robust WebGL context getter that allows software rasterization and devices without dedicated hardware acceleration
function obtainWebGLContext(targetCanvas) {
  const contextTypes = ['webgl2', 'webgl', 'experimental-webgl'];
  const optionProfiles = [
    { antialias: false, depth: true, alpha: true, failIfMajorPerformanceCaveat: false, powerPreference: 'default' },
    { depth: true, alpha: true, failIfMajorPerformanceCaveat: false },
    { failIfMajorPerformanceCaveat: false },
    { antialias: false, depth: true },
    {}
  ];

  for (const type of contextTypes) {
    for (const opts of optionProfiles) {
      try {
        const gl = targetCanvas.getContext(type, opts);
        if (gl) return gl;
      } catch {}
    }
  }

  try {
    if (typeof infinityrt_getwebglcontext === 'function') {
      const gl = infinityrt_getwebglcontext(targetCanvas, { failIfMajorPerformanceCaveat: false, antialias: false });
      if (gl) return gl;
    }
  } catch {}

  return null;
}

try {
  const gl = obtainWebGLContext(canvas);
  if (!gl) {
    console.warn('WebGL context unavailable on this device/browser');
    if (parent !== window) {
      parent.postMessage({ type: 'bullet-unsupported' }, location.origin);
    }
    statusElement.style.opacity = '0';
    statusElement.style.pointerEvents = 'none';
    throw new Error('WebGL unavailable');
  }
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Bullet 350. Drag to orbit 360°; scroll to zoom; Ctrl + drag to pan anchor.');
  scene = new infinityrt_scene({rtgl:gl,useDraco:false,forcewebp:true}, 'https://reconfiguratorprod.royalenfield.com/models/J1B10SEP2024/bullet350/Web/model_gl/', canvas.width, canvas.height);
  scene._flipFoVonAspectSwap = true;
  scene._nav = new infinityrt_navigation(scene, canvas.width, canvas.height);
  scene._nav._panMin = [-200.0, -200.0];
  scene._nav._panMax = [200.0, 200.0];
  scene._nav._navMaxDolly = 500.0;
  scene._nav._navMaxDollyOriginal = 500.0;
  scene._nav._navMinDolly = -120.0;
  scene._nav._navMinDollyOriginal = -120.0;
  scene._nav._navRotationSpeed = .003;

  // Protect _navMaxDolly against internal reset back down to 1.0
  const originalGetZoomFactor = scene._nav.getZoomFactor.bind(scene._nav);
  scene._nav.getZoomFactor = function() {
    if (this._navMaxDolly < 400) {
      this._navMaxDolly = 500.0;
      this._navMaxDollyOriginal = 500.0;
    }
    return originalGetZoomFactor();
  };
  scene.start();
  function render(time) {
    if (stopped || failed) return;
    frame = requestAnimationFrame(render);
    if ((document.hidden || !heroVisible) && ready) return;
    const elapsed = Math.min(50, time - previousTime);
    previousTime = time;
    if (ready && pointers.size === 0 && Math.abs(scene._nav._navXAng - restTilt) > .0005) {
      scene._nav._navXAng += (restTilt - scene._nav._navXAng) * Math.min(1, elapsed * .004);
      scene._nav._navChange = true;
      scene.clearRefine();
    }
    if (ready && !reduceMotion && pointers.size === 0 && time > pauseRotationUntil) {
      scene._nav._navYAng = (scene._nav._navYAng + elapsed * .000075) % (Math.PI * 2);
      scene._nav._navChange = true;
      scene.clearRefine();
    }
    scene.setViewMatrix(scene._nav.NavCreateViewMatrix(scene._initialViewMatrix));
    scene.setModelMatrix(scene._nav.NavCreateModelMatrix(scene._initialViewMatrix));
    if (scene.draw()) {
      statusElement.style.opacity = '0';
      statusElement.style.pointerEvents = 'none';
      if (!ready) {
        ready = true;
        buttons.forEach(b => b.disabled = false);
        finish('premium');
        if (parent !== window) {
          parent.postMessage({ type: 'bullet-ready', finish: 'premium' }, location.origin);
        }
      }
    } else if (!ready) {
      progressElement.textContent = `Loading machine · ${Math.min(99, Math.max(0, Math.round((1 - scene._outstandingjobs / scene._totaljobs) * 100)))}%`;
    }
  }
  render();
  setTimeout(() => { if (!ready && !stopped) fail('Loading is taking longer than expected. Check your connection and reload to retry.'); }, 180000);
  window.addEventListener('resize', () => {
    canvas.width = innerWidth; canvas.height = innerHeight;
    scene.resize(canvas.width, canvas.height);
    scene._nav._midx = canvas.width / 2; scene._nav._midy = canvas.height / 2;
    resetView(true);
  });
  let pinchDistance = null;
  let isPanning = false;

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('pointerdown', e => {
    if (!ready) return;
    pauseRotationUntil = performance.now() + 8000;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({preventScroll:true});
    isPanning = Boolean(e.ctrlKey || e.metaKey || e.button === 2 || e.button === 1);
    canvas.style.cursor = isPanning ? 'move' : 'grabbing';
  });

  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) {
      if (innerWidth >= 768) {
        canvas.style.cursor = (e.ctrlKey || e.metaKey) ? 'move' : 'grab';
      }
      return;
    }
    const last = pointers.get(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    const deltaX = e.clientX - last[0], deltaY = e.clientY - last[1];

    if (e.pointerType === 'touch' && pointers.size === 1 && Math.abs(deltaY) > Math.abs(deltaX)) {
      parent.postMessage({type:'bullet-scroll', deltaY:-deltaY}, location.origin);
      return;
    }

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinchDistance !== null) scene._nav.NavChangeDolly((pinchDistance - distance) * 0.4);
      pinchDistance = distance;
    } else {
      const panActive = e.ctrlKey || e.metaKey || isPanning || e.buttons === 2 || e.buttons === 4;
      if (panActive) {
        // Move the anchor (camera pan)
        scene._nav.NavPan([deltaX, deltaY]);
      } else {
        // Orbit in 360 degrees
        scene._nav.NavRotation([e.clientX, e.clientY], [deltaX, deltaY]);
        scene._nav._navXAng = Math.max(-0.2, Math.min(0.55, scene._nav._navXAng));
      }
    }
    scene.clearRefine();
  });

  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(event, e => {
      pointers.delete(e.pointerId);
      pinchDistance = null;
      isPanning = false;
      canvas.style.cursor = (e.ctrlKey || e.metaKey) ? 'move' : 'grab';
    });
  }

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const isMobileDevice = innerWidth < 768 || matchMedia('(pointer: coarse)').matches;
    if (isMobileDevice) {
      if (parent !== window) parent.postMessage({type:'bullet-scroll', deltaY:e.deltaY}, location.origin);
    } else if (ready) {
      // Desktop view only: zoom in and out with mouse wheel
      pauseRotationUntil = performance.now() + 6000;
      scene._nav.NavChangeDolly(e.deltaY * 0.15);
      scene.clearRefine();
    }
  }, {passive:false});

  window.addEventListener('keydown', e => {
    if ((e.key === 'Control' || e.key === 'Meta') && innerWidth >= 768) {
      canvas.style.cursor = 'move';
    }
    if (!ready) return;
    const directions = {ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]};
    if (directions[e.key]) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        scene._nav.NavPan([directions[e.key][0] * 2, directions[e.key][1] * 2]);
      } else {
        scene._nav.NavRotation([0,0], directions[e.key]);
      }
    } else if (['+','=','-'].includes(e.key)) {
      e.preventDefault();
      scene._nav.NavChangeDolly(e.key === '-' ? 15 : -15);
    } else return;
    scene.clearRefine();
  });

  window.addEventListener('keyup', e => {
    if ((e.key === 'Control' || e.key === 'Meta') && innerWidth >= 768) {
      canvas.style.cursor = 'grab';
    }
  });
  goldButton.onclick = () => { pauseRotationUntil = performance.now() + 3000; finish('premium'); };
  standardButton.onclick = () => { pauseRotationUntil = performance.now() + 3000; finish('black'); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail('The graphics context was interrupted. Reload to reopen the model.'); });
  window.addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    if (e.data?.type === 'bullet-visibility') {
      heroVisible = Boolean(e.data.visible);
      previousTime = performance.now();
    } else if (e.data?.type === 'set-finish') {
      if (ready && (e.data.finish === 'premium' || e.data.finish === 'black')) {
        pauseRotationUntil = performance.now() + 4000;
        finish(e.data.finish);
      }
    } else if (e.data?.type === 'bullet-drag') {
      if (ready) {
        pauseRotationUntil = performance.now() + 4000;
        const deltaX = Number(e.data.deltaX) || 0;
        const deltaY = Number(e.data.deltaY) || 0;
        scene._nav.NavRotation([0, 0], [deltaX, deltaY]);
        scene._nav._navXAng = Math.max(.08, Math.min(.38, scene._nav._navXAng));
        scene.clearRefine();
      }
    }
  });
} catch (err) {
  console.warn('[Bullet 3D Init]:', err);
  if (parent !== window) {
    parent.postMessage({ type: 'bullet-unsupported' }, location.origin);
  }
  statusElement.style.opacity = '0';
  statusElement.style.pointerEvents = 'none';
}
