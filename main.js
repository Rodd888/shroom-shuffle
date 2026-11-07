'use strict';

cvs = document.getElementById('c');
ctx = cvs.getContext('2d');

reset();

function isPound(c) {
  return c === 'KeyX' || c === 'ShiftLeft' || c === 'ShiftRight' || c === 'KeyJ';
}

window.addEventListener('keydown', function (e) {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
      e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    e.preventDefault();
  }
  if (e.repeat) return;
  if (e.code === 'KeyR') { reset(); return; }

  keys.add(e.code);
  if (st.phase === 'intro') { beginMatch(); return; }

  var me = players[0];
  if (e.code === 'Space') tryJump(me);
  else if (isPound(e.code)) tryPound(me);
});

window.addEventListener('keyup', function (e) { keys.delete(e.code); });
window.addEventListener('blur', function () { keys.clear(); });

cvs.addEventListener('pointerdown', function () {
  if (st.phase === 'intro') beginMatch();
  else if (st.phase === 'over') reset();
});

var last = performance.now();

function frame(now) {
  var dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  step(dt);
  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
