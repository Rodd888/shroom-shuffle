'use strict';

function tryJump(p) {
  if (p.mode !== 'alive' || p.stun > 0 || !p.ground) return;
  p.vz = JUMPV;
  p.z = 0.2;
  p.ground = false;
}

function tryPound(p) {
  if (p.mode !== 'alive' || p.ground) return;
  p.vz = POUNDV;
  p.pound = true;
}

function splash(x, y) {
  for (var i = 0; i < 18; i++) {
    var a = Math.random() * Math.PI * 2;
    var s = 40 + Math.random() * 150;
    parts.push({
      x: x, y: y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6,
      life: 0.55, max: 0.55,
      c: i % 3 ? '#bfe9ff' : '#ffffff',
      r: 3 + Math.random() * 3
    });
  }
}

function drown(p) {
  if (p.mode !== 'alive') return;
  p.mode = 'drown';
  p.sinkT = 0;
  p.ground = false;
  p.plat = null;
  p.z = 0;
  p.vz = 0;
  splash(p.x, p.y + 6);
  st.msg = p.name + ' is carried away!';
  st.msgT = 1.5;
}

function impact(p, plat) {
  st.shake = Math.max(st.shake, 9);
  for (var i = 0; i < players.length; i++) {
    var q = players[i];
    if (q === p || q.mode !== 'alive') continue;
    if (platAt(q.x, q.y) !== plat) continue;
    if (q.z > 45) continue;
    q.stun = 1.15;
    q.vx = 0;
    q.vy = 0;
    var dx = q.x - p.x, dy = q.y - p.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    q.x += dx / d * 14;
    q.y += dy / d * 14;
  }
  for (var j = 0; j < 14; j++) {
    var a = Math.random() * Math.PI * 2;
    var s = 80 + Math.random() * 200;
    parts.push({
      x: p.x, y: p.y + 4,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5,
      life: 0.4, max: 0.4, c: '#ffffff', r: 4 + Math.random() * 3
    });
  }
}

function stepPlayer(p, dt) {
  if (p.mode === 'drown') {
    p.sinkT += dt;
    p.z -= 110 * dt;
    if (p.sinkT > 1) p.mode = 'out';
    return;
  }
  if (p.mode !== 'alive') return;

  if (p.stun > 0) p.stun = Math.max(0, p.stun - dt);
  var canAct = p.stun <= 0;

  var tx = 0, ty = 0;
  if (canAct) {
    var len = Math.sqrt(p.wx * p.wx + p.wy * p.wy);
    if (len > 0.001) { tx = p.wx / len * RUN; ty = p.wy / len * RUN; }
  }
  if (p.ground) {
    p.vx = tx;
    p.vy = ty;
  } else if (canAct && (tx || ty)) {
    var k = Math.min(1, AIR * dt);
    p.vx += (tx - p.vx) * k;
    p.vy += (ty - p.vy) * k;
  }
  p.x = clamp(p.x + p.vx * dt, 30, W - 30);
  p.y = clamp(p.y + p.vy * dt, 130, H - 14);

  var support = platAt(p.x, p.y);
  if (support && p.z <= 0.5 && p.vz <= 0) {
    p.ground = true;
    p.z = 0;
    p.vz = 0;
    p.plat = support;
    p.pound = false;
    if (support.drop > DUNK) drown(p);
    return;
  }

  p.ground = false;
  p.plat = null;
  p.vz -= GRAV * dt;
  p.z += p.vz * dt;

  if (p.z <= 0) {
    var s2 = platAt(p.x, p.y);
    if (s2 && s2.drop <= DUNK) {
      p.z = 0;
      p.vz = 0;
      p.ground = true;
      p.plat = s2;
      if (p.pound) {
        p.pound = false;
        impact(p, s2);
      }
    } else {
      drown(p);
    }
  }
}

function readInput(p) {
  p.wx = 0;
  p.wy = 0;
  if (st.phase === 'intro') return;
  if (p.mode !== 'alive' || p.stun > 0) return;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) p.wx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) p.wx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) p.wy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) p.wy += 1;
}

function maybeShove(bot, dt) {
  if (Math.random() > 0.35 * dt) return;
  var here = platAt(bot.x, bot.y);
  for (var i = 0; i < players.length; i++) {
    var q = players[i];
    if (q === bot || q.mode !== 'alive') continue;
    if (platAt(q.x, q.y) !== here) continue;
    var dx = q.x - bot.x, dy = q.y - bot.y;
    if (dx * dx + dy * dy > 8100) continue;
    if (bot.ground) tryJump(bot);
    else if (bot.vz > 0) tryPound(bot);
    return;
  }
}

function botThink(bot, dt) {
  bot.wx = 0;
  bot.wy = 0;
  if (bot.mode !== 'alive' || bot.stun > 0) return;
  if (st.phase !== 'flag' && st.phase !== 'sink') return;

  bot.react -= dt;
  if (bot.react > 0) return;

  var safe = plats[st.safe];
  var cur = platAt(bot.x, bot.y);

  if (cur === safe) {
    var cx = safe.x - bot.x, cy = safe.y - bot.y;
    var cd = Math.sqrt(cx * cx + cy * cy);
    if (cd > 14) { bot.wx = cx / cd * 0.5; bot.wy = cy / cd * 0.5; }
    maybeShove(bot, dt);
    return;
  }

  var goal = safe;
  if (cur && !adjacent(cur, safe)) goal = neighbourToward(cur, safe);

  var dx = goal.x - bot.x, dy = goal.y - bot.y;
  var d = Math.sqrt(dx * dx + dy * dy) || 1;
  bot.wx = dx / d;
  bot.wy = dy / d;

  if (bot.ground && d < 250) {
    if (!platAt(bot.x + bot.wx * 22, bot.y + bot.wy * 22)) tryJump(bot);
  }
}

function checkEnd(dt) {
  if (st.phase === 'over' || st.phase === 'intro') return;
  var living = [];
  for (var i = 0; i < players.length; i++) {
    if (players[i].mode === 'alive') living.push(players[i]);
  }
  if (living.length > 1) { st.endT = null; return; }
  if (st.endT === null) st.endT = 1.1;
  st.endT -= dt;
  if (st.endT <= 0) {
    st.phase = 'over';
    st.winner = living[0] || null;
  }
}

function updateParts(dt) {
  for (var i = 0; i < parts.length; i++) {
    var q = parts[i];
    q.life -= dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vy += 260 * dt;
    q.vx *= 0.96;
  }
  parts = parts.filter(function (q) { return q.life > 0; });
}

function step(dt) {
  T += dt;
  if (st.phase !== 'over') {
    updatePhase(dt);
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      if (p.human) readInput(p); else botThink(p, dt);
      stepPlayer(p, dt);
    }
    checkEnd(dt);
  }
  updateParts(dt);
  if (st.shake > 0) st.shake = Math.max(0, st.shake - 45 * dt);
  if (st.msgT > 0) st.msgT -= dt;
}
