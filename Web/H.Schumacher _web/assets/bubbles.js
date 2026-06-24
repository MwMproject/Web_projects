(function () {
  const canvas = document.getElementById('bubbleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const SOURCE_X_RATIOS = [0.12, 0.28, 0.45, 0.62, 0.78, 0.91];
  const MIN_BUBBLES = 180;  // jamais en-dessous
  const MAX_BUBBLES = 420;
  const SPAWN_RATE  = 3;    // par frame

  let sources = [];
  const bubbles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    sources = SOURCE_X_RATIOS.map(r => ({ x: canvas.width * r }));
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnBubble(yRatio) {
    const src = sources[Math.floor(Math.random() * sources.length)];
    const r   = rand(1, 6);
    const pts = Math.floor(rand(6, 13));
    // offsets plus forts = forme plus trouble
    const offsets = Array.from({ length: pts }, () => rand(-0.38, 0.38));
    bubbles.push({
      x:          src.x + rand(-canvas.width * 0.14, canvas.width * 0.14),
      y:          canvas.height * (yRatio !== undefined ? yRatio : rand(0.55, 1.08)),
      r,
      pts,
      offsets,
      speedY:     rand(0.5, 1.4),
      driftX:     rand(-0.18, 0.18),
      opacity:    rand(0.35, 0.82),
      wobbleFreq: rand(0.03, 0.08),
      wobbleAmp:  rand(0.4, 1.2),
      phase:      rand(0, Math.PI * 2),
      tick:       rand(0, 300),
    });
  }

  // pré-remplissage — bulles réparties sur toute la hauteur dès le départ
  function prefill() {
    for (let i = 0; i < MIN_BUBBLES; i++) {
      spawnBubble(rand(0, 1.0));
    }
  }

  // contour irrégulier avec courbes quadratiques (plus trouble que lineTo)
  function blobPath(cx, cy, r, pts, offsets) {
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const angle  = (i / pts) * Math.PI * 2 - Math.PI / 2;
      const angleM = ((i + 0.5) / pts) * Math.PI * 2 - Math.PI / 2;
      const ri  = r * (1 + offsets[i % pts]);
      const rim = r * (1 + offsets[(i + Math.floor(pts / 2)) % pts] * 0.5);
      const x  = cx + Math.cos(angle)  * ri;
      const y  = cy + Math.sin(angle)  * ri;
      const mx = cx + Math.cos(angleM) * rim;
      const my = cy + Math.sin(angleM) * rim;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(mx, my, x, y);
    }
    ctx.closePath();
  }

  function drawBubble(b) {
    const cx = b.x + Math.sin(b.tick * b.wobbleFreq + b.phase) * b.wobbleAmp;
    const cy = b.y;
    const r  = b.r;
    const a  = b.opacity;

    const grad = ctx.createRadialGradient(
      cx - r * 0.32, cy - r * 0.32, r * 0.04,
      cx, cy, r
    );
    grad.addColorStop(0,   `rgba(255,255,255,${a})`);
    grad.addColorStop(0.35,`rgba(225,245,255,${a * 0.55})`);
    grad.addColorStop(1,   `rgba(190,230,255,${a * 0.10})`);

    blobPath(cx, cy, r, b.pts, b.offsets);
    ctx.fillStyle = grad;
    ctx.fill();

    blobPath(cx, cy, r, b.pts, b.offsets);
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.45})`;
    ctx.lineWidth = 0.35;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // maintien du minimum — spawn groupé si trop peu
    const deficit = MIN_BUBBLES - bubbles.length;
    const toSpawn = deficit > 0 ? Math.max(deficit, SPAWN_RATE) : (bubbles.length < MAX_BUBBLES ? SPAWN_RATE : 0);
    for (let i = 0; i < toSpawn; i++) spawnBubble();

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.tick++;
      b.y -= b.speedY;
      b.x += b.driftX;

      if (b.y + b.r < 0) {
        bubbles.splice(i, 1);
        continue;
      }
      drawBubble(b);
    }

    requestAnimationFrame(draw);
  }

  resize();
  prefill();
  window.addEventListener('resize', () => { resize(); });
  draw();
})();
