// js/data/projects.js
// Static content module. In Stage 2 this can be replaced by a fetch()
// to /api/projects without touching any rendering code.
window.Term = window.Term || {};

window.Term.PROJECTS = [
  {
    id: 'folio-ink',
    name: 'folio.ink',
    role: 'DevOps Lead / Backend Support',
    stack: ['Tauri v2', 'React', 'Flask', 'SQLAlchemy', 'PyInstaller'],
    repo: 'https://github.com/aeterna-tech',
    desc:
      'Desktop developer-diary app. Owns infra end-to-end: org migration, ' +
      'branch protection via Repository Ruleset, flake8 CI, SQLite pathing ' +
      'via platformdirs, cross-platform packaging.'
  },
  {
    id: 'edu-portal',
    name: 'edu web portal + student personal account system',
    role: 'Lead Developer / DevOps',
    stack: ['PHP', 'jQuery', 'LDAP/AD', 'Docker', 'Nginx Proxy Manager'],
    repo: null,
    desc:
      'College services portal and personal-cabinet system. LDAP-backed auth, ' +
      'self-service password reset, weekly schedule view. Deployed as ' +
      'containers behind NPM on Ubuntu.'
  },
  {
    id: 'ansible-awx',
    name: 'edu-ansible-awx',
    role: 'Author / Maintainer',
    stack: ['Ansible', 'AWX', 'Vault', 'GLPI dynamic inventory'],
    repo: null,
    desc:
      'Infrastructure-as-code repo for the college fleet: Windows and Linux ' +
      'targets, RustDesk rollout, GLPI-driven dynamic inventory, Vault-backed ' +
      'secrets, staged KSC migration plan.'
  },
  {
    id: 'vacancy-monitor',
    name: 'vacancy-monitor',
    role: 'Author',
    stack: ['Python', 'Playwright', 'Flask', 'Docker Compose'],
    repo: 'https://github.com/v1tharr/vacancy-monitor',
    desc:
      'Telegram bot that watches job boards and pushes new postings. ' +
      'Headless-browser scraping, small Flask control UI, single-command ' +
      'Docker Compose deploy.'
  },
  {
    id: 'bots-migration',
    name: 'legacy-bots-dockerization',
    role: 'Author',
    stack: ['Docker', 'Ubuntu', 'VK API', 'Telegram API'],
    repo: null,
    desc:
      'Migrated two VK bots off Windows Server/NSSM onto Docker on Ubuntu; ' +
      'rewrote the helpdesk bot stateless; moved an FAQ bot from MSSQL+XML ' +
      'to JSON over Docker volumes.'
  },
  {
    id: 'effective-mobile-test',
    name: 'effective-mobile-devops-test',
    role: 'Author',
    stack: ['Python 3.12 (http.server)', 'Nginx 1.25 (alpine)', 'Docker Compose'],
    repo: 'https://github.com/v1tharr/effective-mobile-devops-test',
    desc:
      'Junior DevOps take-home assignment. Nginx reverse-proxies a Python ' +
      'backend inside an isolated Docker network; only nginx is published ' +
      'on :80, the backend port stays internal. Env template via ' +
      '.env.example, one-command bring-up via Docker Compose.'
  }
];
