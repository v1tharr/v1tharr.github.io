// js/core/CommandHandler.js
//
// Every command resolves through a Promise, regardless of whether it is
// answered locally (Stage 1) or will eventually hit a Flask endpoint
// (Stage 2). TerminalCore never knows the difference.
//
// Stage 2 plan: commands flagged `remote: true` currently return a stub.
// Swapping them for real behaviour means replacing the body of
// `runRemote()` with a single fetch('/api/command', { ... }) call —
// no change required in TerminalCore or in index.html.

// Reads shared data from window.Term, populated by the scripts in
// js/data/*.js, which must load before this file (see index.html).
window.Term = window.Term || {};

const PROJECTS = window.Term.PROJECTS;
const SKILL_GROUPS = window.Term.SKILL_GROUPS;
const ABOUT_LINES = window.Term.ABOUT_LINES;
const CONTACTS = window.Term.CONTACTS;
const ELSEWHERE = window.Term.ELSEWHERE;

const L = (text, cls = 'out') => ({ text, cls });

class CommandHandler {
  constructor() {
    this.startedAt = Date.now();
    this.registry = this.buildRegistry();
  }

  /** Public entry point. Always returns a Promise. */
  run(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return Promise.resolve({ action: 'print', lines: [] });

    const [name, ...args] = trimmed.split(/\s+/);
    const key = name.toLowerCase();
    const cmd = this.registry[key];

    if (!cmd) {
      return Promise.resolve({
        action: 'print',
        lines: [
          L(`command not found: ${name}`, 'err'),
          L(`type 'help' to list available utilities`, 'dim'),
        ],
      });
    }

    if (cmd.remote) return this.runRemote(key, args);

    return Promise.resolve(cmd.handler(args));
  }

  /** Stage 2 placeholder transport. */
  runRemote(name, _args) {
    // Stage 2:
    // return fetch('/api/command', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name, args: _args }),
    // }).then(r => r.json());
    return Promise.resolve({
      action: 'print',
      lines: [
        L(`${name}: backend not attached in this build`, 'warn'),
        L('reserved for the live Flask API — stage 2', 'dim'),
      ],
    });
  }

  listForHelp() {
    return Object.entries(this.registry)
      .filter(([, c]) => !c.hidden)
      .map(([key, c]) => ({ key, summary: c.summary, usage: c.usage }));
  }

  buildRegistry() {
    return {
      help: {
        summary: 'list available utilities',
        usage: 'help',
        handler: () => this.cmdHelp(),
      },
      about: {
        summary: 'print operator profile',
        usage: 'about',
        handler: () => this.cmdAbout(),
      },
      projects: {
        summary: 'list projects, or inspect one by id',
        usage: 'projects [--view <id>]',
        handler: (args) => this.cmdProjects(args),
      },
      contacts: {
        summary: 'print contact channels',
        usage: 'contacts',
        handler: () => this.cmdContacts(),
      },
      elsewhere: {
        summary: 'other places online',
        usage: 'elsewhere',
        handler: () => this.cmdElsewhere(),
      },
      skills: {
        summary: 'print technical proficiency table',
        usage: 'skills',
        handler: () => this.cmdSkills(),
      },
      status: {
        summary: 'query operator service status',
        usage: 'status',
        handler: () => this.cmdStatus(),
      },
      clear: {
        summary: 'clear the screen',
        usage: 'clear',
        handler: () => ({ action: 'clear' }),
      },
      whoami: {
        summary: 'print the current session identity',
        usage: 'whoami',
        hidden: true,
        handler: () => ({
          action: 'print',
          lines: [L('uid=1000(vitharr) groups=devops,backend,ops')],
        }),
      },
      sudo: {
        summary: 'attempt to elevate privileges',
        usage: 'sudo <command>',
        hidden: true,
        handler: (args) => this.cmdSudo(args),
      },
      ping: { summary: 'live latency probe', usage: 'ping <host>', remote: true },
      htop: { summary: 'live process monitor', usage: 'htop', remote: true },
      logs: { summary: 'stream container logs', usage: 'logs <container>', remote: true },
    };
  }

  // -- individual commands ------------------------------------------------

  cmdHelp() {
    const rows = this.listForHelp();
    const width = Math.max(...rows.map((r) => r.usage.length)) + 2;
    const lines = [
      L('NAME', 'dim'),
      L('    utilities — commands recognised by this terminal'),
      L(''),
      L('SYNOPSIS', 'dim'),
      ...rows.map((r) => L('    ' + r.usage.padEnd(width) + r.summary)),
      L(''),
      L('use ↑ / ↓ to recall previous commands', 'dim'),
    ];
    return { action: 'print', lines };
  }

  cmdAbout() {
    return { action: 'print', lines: ABOUT_LINES.map((t) => L(t)) };
  }

  cmdProjects(args) {
    const viewFlagIdx = args.indexOf('--view');
    if (viewFlagIdx !== -1) {
      const id = args[viewFlagIdx + 1];
      const project = PROJECTS.find((p) => p.id === id);
      if (!project) {
        return {
          action: 'print',
          lines: [
            L(`no such project: ${id ?? '(missing id)'}`, 'err'),
            L("run 'projects' to list valid ids", 'dim'),
          ],
        };
      }
      return { action: 'print', lines: this.renderProjectDetail(project) };
    }

    const lines = [L('PROJECTS', 'dim'), L('')];
    PROJECTS.forEach((p, i) => {
      lines.push(L(`[${String(i + 1).padStart(2, '0')}] ${p.name}`, 'accent'));
      lines.push(L(`     role  : ${p.role}`, 'dim'));
      lines.push(
        L(
          `     repo  : ${p.repo ?? 'private / internal'}`,
          p.repo ? 'out' : 'dim'
        )
      );
      lines.push(L(''));
    });
    lines.push(L(`projects --view <id>  ·  ids: ${PROJECTS.map((p) => p.id).join(', ')}`, 'dim'));
    return { action: 'print', lines };
  }

  renderProjectDetail(p) {
    return [
      L(p.name, 'accent'),
      L('─'.repeat(Math.min(p.name.length, 48)), 'dim'),
      L(`role   : ${p.role}`),
      L(`stack  : ${p.stack.join(', ')}`),
      L(`repo   : ${p.repo ?? 'private / internal'}`, p.repo ? 'out' : 'dim'),
      L(''),
      ...wrap(p.desc, 68).map((t) => L(t)),
    ];
  }

  cmdContacts() {
    const lines = [L('CONTACTS', 'dim'), L('')];
    CONTACTS.forEach((c) => {
      lines.push(L(`${c.label.padEnd(10)}${c.value}`));
    });
    return { action: 'print', lines };
  }

  cmdElsewhere() {
    const lines = [L('ELSEWHERE', 'dim'), L('')];
    ELSEWHERE.forEach((c) => {
      lines.push(L(`${c.label}  ·  ${c.desc}`, 'accent'));
      lines.push(L(`  ${c.value}`, 'dim'));
      lines.push(L(''));
    });
    return { action: 'print', lines };
  }

  cmdSkills() {
    const lines = [];
    SKILL_GROUPS.forEach((group) => {
      lines.push(L(group.label, 'dim'));
      group.items.forEach((name) => {
        lines.push(L(`  - ${name}`));
      });
      lines.push(L(''));
    });
    return { action: 'print', lines };
  }

  cmdStatus() {
    const uptimeMs = Date.now() - this.startedAt;
    const uptimeSec = Math.max(1, Math.floor(uptimeMs / 1000));
    const lines = [
      L('● vitharr.service — devops / backend operator', 'accent'),
      L(`     Loaded: loaded (enabled)`),
      L(`     Active: active (running) — session ${uptimeSec}s`, 'ok'),
      L(`      Scope: infrastructure, automation, backend`),
      L(`  Toolchain: linux, docker, python, bash, ldap/ad, ci`),
    ];
    return { action: 'print', lines };
  }

  cmdSudo(args) {
    const attempted = args.join(' ') || '(none)';
    return {
      action: 'print',
      lines: [
        L('[sudo] password for vitharr: '),
        L(`vitharr is not in the sudoers file.`, 'err'),
        L(`this incident (${attempted}) will not be reported.`, 'dim'),
      ],
    };
  }
}

window.Term.CommandHandler = CommandHandler;

// -- helpers ---------------------------------------------------------------

function wrap(text, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > width) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}