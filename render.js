'use strict';

function baseY(p) {
  return p.plat ? p.plat.y + p.plat.drop * FALL : p.y;
}

function drawWater() {
  var g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#12496f');
  g.addColorStop(0.55, '#0b3557');
  g.addColorStop(1, '#06243c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  var ag = ctx.createRadialGradient(CX, CY + 30, 20, CX, CY + 30, 300);
  ag.addColorStop(0, 'rgba(1,8,16,0.75)');
  ag.addColorStop(1, 'rgba(1,8,16,0)');
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.ellipse(CX, CY + 30, 310, 220, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(190,235,255,0.10)';
  ctx.lineWidth = 2;
  for (var i = 0; i < 10; i++) {
    var by = 40 + i * 58;
    ctx.beginPath();
    for (var x = 0; x <= W; x += 24) {
      var y = by + Math.sin(x * 0.018 + T * 1.5 + i) * 5;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawPlatform(pl) {
  if (pl.drop > 0.92) return;
  var y = pl.y + pl.drop * FALL;
  var alpha = Math.min(1, 1 - Math.max(0, pl.drop - 0.35) * 1.5);

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = shade(pl.color, -0.5);
  ctx.beginPath();
  ctx.ellipse(pl.x, y + 13, pl.rx, pl.ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pl.color;
  ctx.beginPath();
  ctx.ellipse(pl.x, y, pl.rx, pl.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.ellipse(pl.x - 10, y - 10, pl.rx * 0.55, pl.ry * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  var n = pl.spots;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  for (var i = 0; i < n; i++) {
    var a = -Math.PI / 2 + i * Math.PI * 2 / n;
    var dx = n === 1 ? 0 : Math.cos(a) * pl.rx * 0.52;
    var dy = n === 1 ? 0 : Math.sin(a) * pl.ry * 0.52;
    ctx.beginPath();
    ctx.ellipse(pl.x + dx, y + dy, n === 1 ? 13 : 6, n === 1 ? 9 : 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if ((st.phase === 'flag' || st.phase === 'sink') && pl.i === st.safe) {
    var pulse = 0.5 + 0.5 * Math.sin(T * 9);
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * pulse) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(pl.x, y, pl.rx + 7 + pulse * 4, pl.ry + 7 + pulse * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(p) {
  if (p.mode === 'out') return;
  var base = baseY(p);
  var y = base - p.z;

  if (p.plat || p.z > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.beginPath();
    ctx.ellipse(p.x, base + 3, 12, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  if (p.mode === 'drown') ctx.globalAlpha = Math.max(0, 1 - p.sinkT * 1.05);

  var bob = (p.ground && Math.abs(p.vx) + Math.abs(p.vy) > 25) ? Math.sin(T * 18) * 1.6 : 0;

  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(p.x, y - 13 + bob, 11, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd8b0';
  ctx.beginPath();
  ctx.arc(p.x, y - 30 + bob, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(p.x, y - 33 + bob, 12, 8, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22303c';
  var look = clamp(p.vx / RUN, -1, 1) * 1.6;
  ctx.beginPath();
  ctx.arc(p.x - 3.4 + look, y - 29 + bob, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x + 3.4 + look, y - 29 + bob, 1.7, 0, Math.PI * 2);
  ctx.fill();

  if (p.stun > 0) {
    ctx.fillStyle = '#ffe36b';
    for (var i = 0; i < 3; i++) {
      var a = T * 7 + i * Math.PI * 2 / 3;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * 13, y - 45 + Math.sin(a) * 5, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  if (p.human) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(p.x - 5, y - 54);
    ctx.lineTo(p.x + 5, y - 54);
    ctx.lineTo(p.x, y - 45);
    ctx.closePath();
    ctx.fill();
  }
}

function drawParts() {
  for (var i = 0; i < parts.length; i++) {
    var q = parts[i];
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.c;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHUD() {
  var safe = plats[st.safe];
  var living = 0;
  for (var i = 0; i < players.length; i++) {
    if (players[i].mode === 'alive') living++;
  }

  ctx.fillStyle = 'rgba(6,20,34,0.72)';
  rr(20, 18, 200, 104, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('SAFE MUSHROOM', 36, 44);

  ctx.fillStyle = safe.color;
  ctx.beginPath();
  ctx.ellipse(64, 82, 32, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  var n = safe.spots;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  for (var k = 0; k < n; k++) {
    var a = -Math.PI / 2 + k * Math.PI * 2 / n;
    var dx = n === 1 ? 0 : Math.cos(a) * 15;
    var dy = n === 1 ? 0 : Math.sin(a) * 11;
    ctx.beginPath();
    ctx.ellipse(64 + dx, 82 + dy, n === 1 ? 8 : 3.6, n === 1 ? 6 : 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.font = '700 19px system-ui, sans-serif';
  ctx.fillText(safe.name, 110, 78);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillText(n + (n === 1 ? ' spot' : ' spots'), 110, 98);

  if (st.phase === 'flag') {
    var w = 168 * clamp(st.t / st.warn, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    rr(36, 106, 168, 6, 3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    rr(36, 106, w, 6, 3);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(6,20,34,0.72)';
  rr(W - 212, 18, 192, 104, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.stroke();

  var stat = function (label, value, y) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(label, W - 192, y);
    ctx.fillStyle = '#fff';
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value, W - 36, y);
    ctx.textAlign = 'left';
  };
  stat('ROUND', String(Math.max(1, st.round)), 44);
  stat('SPEED', String(Math.min(9, 1 + Math.floor(Math.max(0, st.round - 1) / 2))), 72);
  stat('AFLOAT', living + ' / 4', 100);

  if (st.msgT > 0) {
    ctx.globalAlpha = clamp(st.msgT, 0, 1);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(st.msg, W / 2, 132);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillText('WASD / arrows run - Space jump - X ground-pound - R restart', 22, H - 18);

  if (players[0].mode !== 'alive' && st.phase !== 'over') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('You fell in - spectating (R to restart)', W - 22, H - 18);
    ctx.textAlign = 'left';
  }
}

function veil(a) {
  ctx.fillStyle = 'rgba(3,10,18,' + a + ')';
  ctx.fillRect(0, 0, W, H);
}

function drawOverlays() {
  ctx.textAlign = 'center';

  if (st.phase === 'intro') {
    veil(0.7);
    ctx.fillStyle = '#fff';
    ctx.font = '800 56px system-ui, sans-serif';
    ctx.fillText('SHROOM SHUFFLE', W / 2, 214);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 19px system-ui, sans-serif';
    ctx.fillText('One mushroom is named safe. The rest sink. Get to the named one.', W / 2, 266);
    ctx.fillText('Jump the gaps, pound rivals to stun them, and be the last one afloat.', W / 2, 296);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '500 15px system-ui, sans-serif';
    ctx.fillText('WASD / arrows to run  -  Space to jump  -  X in mid-air to ground-pound', W / 2, 350);
    ctx.fillText('Every mushroom has its own spot count, so colour is never the only clue.', W / 2, 376);

    var pulse = 0.45 + 0.35 * Math.sin(T * 4);
    ctx.fillStyle = 'rgba(255,255,255,' + pulse + ')';
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText('Press Space to start', W / 2, 452);
  } else if (st.phase === 'over') {
    veil(0.66);
    var won = !!(st.winner && st.winner.human);
    var title = st.winner ? (won ? 'You win!' : st.winner.name + ' wins') : 'Everyone fell in - draw!';
    ctx.fillStyle = won ? '#8fe388' : '#fff';
    ctx.font = '800 52px system-ui, sans-serif';
    ctx.fillText(title, W / 2, 250);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '500 18px system-ui, sans-serif';
    ctx.fillText('Survived ' + Math.max(1, st.round) + (st.round === 1 ? ' round' : ' rounds'), W / 2, 300);

    ctx.fillStyle = '#fff';
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText('Press R to play again', W / 2, 366);
  }

  ctx.textAlign = 'left';
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (st.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
  }

  drawWater();

  var items = [];
  plats.forEach(function (pl) {
    items.push({ y: pl.y + pl.drop * FALL, fn: function () { drawPlatform(pl); } });
  });
  players.forEach(function (p) {
    if (p.mode === 'out') return;
    items.push({ y: baseY(p) + 2, fn: function () { drawPlayer(p); } });
  });
  items.sort(function (a, b) { return a.y - b.y; });
  items.forEach(function (it) { it.fn(); });

  drawParts();
  if (st.phase !== 'intro') drawHUD();
  drawOverlays();
}
