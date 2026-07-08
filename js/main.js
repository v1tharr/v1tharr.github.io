// js/main.js
// Plain script — intentionally not an ES module, so this runs directly
// from file:// (double-clicking index.html) as well as over http(s).
(function () {
  const outputEl = document.getElementById('output');
  const inputEl = document.getElementById('commandInput');
  const mirrorBeforeEl = document.getElementById('mirrorBefore');
  const mirrorAfterEl = document.getElementById('mirrorAfter');
  const cursorEl = document.getElementById('cursor');
  const promptEl = document.getElementById('promptLabel');
  const clockEl = document.getElementById('clockStatus');

  // The one deliberate signature moment: a geometric 'V' monogram —
  // quiet, sharp-edged, in the accent color. Reveals top-to-bottom once,
  // then breathes quietly (see .line--mark in style.css). Also callable
  // any time via the 'v' command, since 'clear' wipes it like anything
  // else in the output.
  const MARK = Term.MARK;

  // Dry, technical boot log. No dramatics.
  const BOOT_SEQUENCE = [
    { text: MARK, cls: 'mark', delay: 260 },
    { text: '', cls: 'dim', delay: 40 },
    { text: '[ OK ] session initialized', cls: 'ok', delay: 90 },
    { text: '[ OK ] command registry loaded', cls: 'ok', delay: 90 },
    { text: '[ OK ] operator verified: vitharr', cls: 'ok', delay: 100 },
    { text: '', cls: 'dim', delay: 40 },
    { text: "type 'help' to list utilities.", cls: 'dim', delay: 20 },
    { text: '', cls: 'dim', delay: 10 },
  ];

  function appendLine(text, cls) {
    const div = document.createElement('div');
    div.className = cls === 'mark' ? 'line line--mark' : `line line--${cls}`;
    div.textContent = text;
    outputEl.appendChild(div);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function runBoot(sequence, i, done) {
    if (i >= sequence.length) return done();
    const step = sequence[i];
    appendLine(step.text, step.cls);
    setTimeout(() => runBoot(sequence, i + 1, done), step.delay);
  }

  const commandHandler = new Term.CommandHandler();
  const terminal = new Term.TerminalCore({
    outputEl,
    inputEl,
    mirrorBeforeEl,
    mirrorAfterEl,
    cursorEl,
    promptEl,
    clockEl,
    commandHandler,
    promptPath: '~',
  });

  runBoot(BOOT_SEQUENCE, 0, () => terminal.enable());
})();
