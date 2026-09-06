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
window.addEventListener('error', () => fail('The 3D scene could not load. Check your connection and reload the page.'));
function resetView() {
  // Hide the showroom hierarchy while retaining its environment lighting.
  scene.instanceSet('P3F4_Room_3D_0001', 'visible', 0);
  scene.setBackgroundTransparent(true);
  scene._nav._navDXAng = 0;
  scene._nav._navDYAng = 0;
  const mobile = innerWidth < 600;
  Object.assign(scene._nav, {_navGotoPosActive:false, _navXAng:restTilt, _navYAng:5.71, _navDolly:mobile ? -74 : 0, _navDDolly:0, _navPan:mobile ? [0,0] : [-11,6], _navDPan:[0,0], _navTarget:engineOrbitTarget.slice(), _navChange:true});
  scene.clearRefine();
}
function finish(name) {
  scene.groupApplyState(`color_vis:${name}`, undefined, resetView);
  goldButton.setAttribute('aria-pressed', String(name === 'premium'));
  standardButton.setAttribute('aria-pressed', String(name === 'black'));
}
try {
  const gl = infinityrt_getwebglcontext(canvas);
  if (!gl) throw new Error('WebGL unavailable');
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Bullet 350. Drag or use arrow keys to orbit; scroll, pinch, plus or minus to zoom.');
  scene = new infinityrt_scene({rtgl:gl,useDraco:false,forcewebp:true}, 'https://reconfiguratorprod.royalenfield.com/models/J1B10SEP2024/bullet350/Web/model_gl/', canvas.width, canvas.height);
  scene._nav = new infinityrt_navigation(scene, canvas.width, canvas.height);
  scene._nav._navRotationSpeed = .003;
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
      if (!ready) { ready = true; buttons.forEach(b => b.disabled = false); finish('premium'); }
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
    scene.clearRefine();
  });
  let pinchDistance = null;
  canvas.addEventListener('pointerdown', e => { if (!ready) return; pauseRotationUntil = performance.now() + 5000; pointers.set(e.pointerId, [e.clientX,e.clientY]); canvas.setPointerCapture(e.pointerId); canvas.focus({preventScroll:true}); });
  canvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const last = pointers.get(e.pointerId); pointers.set(e.pointerId, [e.clientX,e.clientY]);
    const deltaX = e.clientX-last[0], deltaY = e.clientY-last[1];
    if (e.pointerType === 'touch' && pointers.size === 1 && Math.abs(deltaY) > Math.abs(deltaX)) {
      parent.postMessage({type:'bullet-scroll', deltaY:-deltaY}, location.origin);
      return;
    }
    if (pointers.size === 2) {
      const [a,b] = [...pointers.values()], distance = Math.hypot(a[0]-b[0],a[1]-b[1]);
      if (pinchDistance !== null) scene._nav.NavChangeDolly((pinchDistance-distance)*.4);
      pinchDistance = distance;
    } else {
      scene._nav.NavRotation([e.clientX,e.clientY], [deltaX,deltaY]);
      scene._nav._navXAng = Math.max(.08, Math.min(.38, scene._nav._navXAng));
    }
    scene.clearRefine();
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(event, e => { pointers.delete(e.pointerId); pinchDistance = null; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (parent !== window) parent.postMessage({type:'bullet-scroll', deltaY:e.deltaY}, location.origin);
    else if (ready) { pauseRotationUntil = performance.now() + 5000; scene._nav.NavChangeDolly(e.deltaY*.1); scene.clearRefine(); }
  }, {passive:false});
  canvas.addEventListener('keydown', e => {
    if (!ready) return;
    const directions = {ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]};
    if (directions[e.key]) { e.preventDefault(); scene._nav.NavRotation([0,0], directions[e.key]); }
    else if (['+','=','-'].includes(e.key)) { e.preventDefault(); scene._nav.NavChangeDolly(e.key === '-' ? 10 : -10); }
    else return;
    scene.clearRefine();
  });
  goldButton.onclick = () => { pauseRotationUntil = performance.now() + 3000; finish('premium'); };
  standardButton.onclick = () => { pauseRotationUntil = performance.now() + 3000; finish('black'); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail('The graphics context was interrupted. Reload to reopen the model.'); });
  window.addEventListener('message', e => {
    if (e.origin !== location.origin || e.data?.type !== 'bullet-visibility') return;
    heroVisible = Boolean(e.data.visible);
    previousTime = performance.now();
  });
  window.addEventListener('pagehide', () => { stopped = true; cancelAnimationFrame(frame); scene.stop(); });
} catch { fail('The 3D viewer needs WebGL and an internet connection. Enable hardware acceleration and reload.'); }
