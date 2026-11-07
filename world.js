'use strict';

var W = 960, H = 600;
var GRAV = 1800, JUMPV = 600, POUNDV = -1500, RUN = 200, AIR = 2.2;
var DUNK = 0.55, FALL = 140;
var CX = 480, CY = 380, RING = 190;

var cvs, ctx;

var PAL = [
  ['Crimson', '#e0503f'],
  ['Tangerine', '#e08a33'],
  ['Lemon', '#d9bb3c'],
  ['Lime', '#79b84a'],
  ['Teal', '#3aa8a0'],
  ['Indigo', '#4a6fc4'],
  ['Violet', '#8a5ac0']
];

var plats = PAL.map(function (c, i) {
  var a = -Math.PI / 2 + i * Math.PI * 2 / 7;
  return {
    i: i, name: c[0], color: c[1],
    x: CX + Math.cos(a) * RING,
    y: CY + Math.sin(a) * RING,
    rx: 50, ry: 41,
    drop: 0,
    spots: i + 1
  };
});

var ROSTER = [
  ['You', '#ff4d4d', true],
  ['Pip', '#4d8bff', false],
  ['Moss', '#39c96a', false],
  ['Sunny', '#ffd93d', false]
];

var players, parts, st, T = 0;
var keys = new Set();

function reset() {
  plats.forEach(function (p) { p.drop = 0; });
  players = ROSTER.map(function (r, i) {
    var p = plats[i * 2];
    return {
      name: r[0], color: r[1], human: r[2],
      x: p.x, y: p.y + (i % 2 ? 7 : -7),
      z: 0, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0,
      ground: true, plat: p,
      stun: 0, mode: 'alive', sinkT: 0, pound: false,
      skill: r[2] ? 1 : 0.55 + Math.random() * 0.3,
      react: 0
    };
  });
  parts = [];
  T = 0;
  st = {
    phase: 'intro', t: 0,
    round: 0, safe: Math.floor(Math.random() * 7),
    sinkSpeed: 0.5, warn: 1.5,
    shake: 0, endT: null, winner: null,
    msg: '', msgT: 0
  };
  keys.clear();
}

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

function shade(hex, amt) {
  var n = parseInt(hex.slice(1), 16);
  function f(v) { return Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt); }
  return 'rgb(' + f((n >> 16) & 255) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
}

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function platAt(x, y) {
  for (var i = 0; i < plats.length; i++) {
    var p = plats[i];
    var dx = (x - p.x) / p.rx, dy = (y - p.y) / p.ry;
    if (dx * dx + dy * dy <= 1) return p;
  }
  return null;
}

function ringDist(a, b) {
  var d = Math.abs(a - b) % 7;
  return Math.min(d, 7 - d);
}

function adjacent(a, b) { return ringDist(a.i, b.i) === 1; }

function neighbourToward(a, b) {
  var l = plats[(a.i + 1) % 7];
  var r = plats[(a.i + 6) % 7];
  return ringDist(l.i, b.i) <= ringDist(r.i, b.i) ? l : r;
}

function pickSafe() {
  var s = Math.floor(Math.random() * 7);
  if (s === st.safe) s = (s + 1 + Math.floor(Math.random() * 6)) % 7;
  return s;
}

function startRound() {
  st.round += 1;
  st.safe = pickSafe();
  st.warn = Math.max(0.42, 1.5 - st.round * 0.055);
  st.sinkSpeed = 0.5 + st.round * 0.06;
  st.phase = 'flag';
  st.t = st.warn;
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    if (p.mode === 'alive') p.react = 0.12 + (1 - p.skill) * 0.45 + Math.random() * 0.25;
  }
}

function beginMatch() {
  if (st.phase !== 'intro') return;
  st.phase = 'pause';
  st.t = 1.5;
  st.msg = 'GET READY';
  st.msgT = 1.5;
}

function updatePhase(dt) {
  var i, p, all;
  if (st.phase === 'flag') {
    st.t -= dt;
    if (st.t <= 0) st.phase = 'sink';
  } else if (st.phase === 'sink') {
    all = true;
    for (i = 0; i < plats.length; i++) {
      p = plats[i];
      if (p.i === st.safe) {
        p.drop = Math.max(0, p.drop - 4 * dt);
      } else {
        p.drop = Math.min(1, p.drop + st.sinkSpeed * dt);
        if (p.drop < 1) all = false;
      }
    }
    if (all) st.phase = 'rise';
  } else if (st.phase === 'rise') {
    all = true;
    for (i = 0; i < plats.length; i++) {
      p = plats[i];
      p.drop = Math.max(0, p.drop - 1.5 * dt);
      if (p.drop > 0) all = false;
    }
    if (all) { st.phase = 'pause'; st.t = 0.28; }
  } else if (st.phase === 'pause') {
    st.t -= dt;
    if (st.t <= 0) startRound();
  }
}
