// js/core/TerminalCore.js
//
// Owns the DOM: rendering lines, the prompt, input, and history.
// Knows nothing about what commands mean — it only calls
// commandHandler.run(text) and renders whatever Promise resolves to.
//
// Input trick: the real <input> is invisible (opacity: 0) but still
// receives focus, keystrokes, and paste. A mirror <span> shows the same
// text styled like terminal output, immediately followed by the blinking
// cursor block — so the cursor always sits right after the last typed
// character instead of being pinned to the edge of the line.

window.Term = window.Term || {};

class TerminalCore {
  constructor({ outputEl, inputEl, mirrorEl, cursorEl, promptEl, clockEl, commandHandler, promptPath = '~' }) {
    this.outputEl = outputEl;
    this.inputEl = inputEl;
    this.mirrorEl = mirrorEl;
    this.cursorEl = cursorEl;
    this.promptEl = promptEl;
    this.clockEl = clockEl;
    this.commandHandler = commandHandler;
    this.promptPath = promptPath;

    this.history = [];
    this.historyIndex = -1;
    this.busy = false;

    this.setPromptPath(promptPath);
    this.bindEvents();
    this.tickClock();
    setInterval(() => this.tickClock(), 1000);
  }

  bindEvents() {
    this.inputEl.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.inputEl.addEventListener('input', () => this.syncMirror());

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.recallHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.recallHistory(1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.autocomplete();
      }
    });

    document.addEventListener('click', () => {
      if (!this.busy) this.inputEl.focus();
    });
  }

  syncMirror() {
    this.mirrorEl.textContent = this.inputEl.value;
  }

  setPromptPath(path) {
    this.promptPath = path;
    this.promptEl.textContent = `vitharr@tech:${path}#`;
  }

  tickClock() {
    if (!this.clockEl) return;
    const now = new Date();
    this.clockEl.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
  }

  async handleSubmit() {
    const raw = this.inputEl.value;
    if (this.busy) return;

    this.printEcho(raw);
    this.inputEl.value = '';
    this.syncMirror();

    if (raw.trim()) {
      this.history.push(raw);
      this.historyIndex = this.history.length;
    }

    this.busy = true;
    this.inputEl.disabled = true;

    try {
      const result = await this.commandHandler.run(raw);
      this.applyResult(result);
    } catch (err) {
      this.printLines([{ text: `internal error: ${err?.message ?? err}`, cls: 'err' }]);
    } finally {
      this.busy = false;
      this.inputEl.disabled = false;
      this.inputEl.focus();
      this.scrollToBottom();
    }
  }

  applyResult(result) {
    if (!result) return;
    if (result.action === 'clear') {
      this.outputEl.innerHTML = '';
      return;
    }
    if (result.action === 'print') {
      this.printLines(result.lines);
    }
  }

  printEcho(raw) {
    const wrap = document.createElement('div');
    wrap.className = 'line line--echo';
    const promptSpan = document.createElement('span');
    promptSpan.className = 'echo-prompt';
    promptSpan.textContent = `vitharr@tech:${this.promptPath}# `;
    wrap.appendChild(promptSpan);
    wrap.appendChild(document.createTextNode(raw));
    this.outputEl.appendChild(wrap);
  }

  printLines(lines) {
    for (const { text, cls = 'out' } of lines) {
      const div = document.createElement('div');
      div.className = `line line--${cls}`;
      div.textContent = text;
      this.outputEl.appendChild(div);
    }
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  recallHistory(direction) {
    if (!this.history.length) return;
    this.historyIndex = Math.min(
      this.history.length,
      Math.max(0, this.historyIndex + direction)
    );
    this.inputEl.value = this.history[this.historyIndex] ?? '';
    this.syncMirror();
    requestAnimationFrame(() => {
      this.inputEl.selectionStart = this.inputEl.selectionEnd = this.inputEl.value.length;
    });
  }

  autocomplete() {
    const val = this.inputEl.value.trim();
    if (!val) return;
    const candidates = this.commandHandler
      .listForHelp()
      .map((c) => c.key)
      .filter((k) => k.startsWith(val));
    if (candidates.length === 1) {
      this.inputEl.value = candidates[0] + ' ';
      this.syncMirror();
    }
  }

  enable() {
    this.inputEl.disabled = false;
    this.inputEl.focus();
  }
}

window.Term.TerminalCore = TerminalCore;
