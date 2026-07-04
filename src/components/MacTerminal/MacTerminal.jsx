import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { skills, projects } from '../../data/portfolio';
import './MacTerminal.css';

const BOOT_LINES = [
  "Welcome to Harshil's portfolio terminal.",
  "Type 'help' to get started.",
];

const LINKS = {
  github: 'https://github.com/Marshmellow31',
  linkedin: 'https://www.linkedin.com/in/harshil-patel-31h/',
  email: 'mailto:1080patelharshil@gmail.com',
};

const OPEN_MAP = {
  paymatrix: 'https://pay-matrix.vercel.app/',
  ascend: 'https://github.com/Marshmellow31/Ascend',
  picklerage: 'https://github.com/Marshmellow31/PickleRage-website',
  jarvis: 'https://github.com/Marshmellow31',
  playhub: 'https://github.com/Marshmellow31',
};

const COMMAND_LIST = [
  ['help', 'list all commands'],
  ['about', 'a short bio'],
  ['skills', 'grouped tech stack'],
  ['projects', 'featured projects'],
  ['open <name>', 'open a project (paymatrix, ascend, picklerage, jarvis, playhub)'],
  ['github', 'open GitHub profile'],
  ['linkedin', 'open LinkedIn profile'],
  ['email', 'send me an email'],
  ['whoami', 'who are you?'],
  ['sudo hire-me', 'the fast track'],
  ['clear', 'clear the terminal'],
];

// Names used for Tab autocomplete
const COMPLETIONS = ['help', 'about', 'skills', 'projects', 'open ', 'github', 'linkedin', 'email', 'whoami', 'sudo hire-me', 'clear'];

function commonPrefix(strings) {
  if (!strings.length) return '';
  let prefix = strings[0];
  for (const s of strings.slice(1)) {
    while (!s.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export default function MacTerminal() {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState('');
  const [booted, setBooted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const draftRef = useRef('');
  const lastTabRef = useRef(0);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  /* ── Boot sequence: typed line-by-line, ~40ms/char ── */
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setLines(BOOT_LINES.map(text => ({ type: 'output', text })));
      setBooted(true);
      return;
    }
    let line = 0;
    let char = 0;
    setLines([{ type: 'output', text: '' }]);
    const id = setInterval(() => {
      if (line >= BOOT_LINES.length) {
        clearInterval(id);
        setBooted(true);
        return;
      }
      char += 1;
      const done = char >= BOOT_LINES[line].length;
      const currentLine = line;
      const currentChar = char;
      setLines(prev => {
        const next = [...prev];
        next[currentLine] = { type: 'output', text: BOOT_LINES[currentLine].slice(0, currentChar) };
        return next;
      });
      if (done) {
        line += 1;
        char = 0;
        if (line < BOOT_LINES.length) {
          setLines(prev => [...prev, { type: 'output', text: '' }]);
        }
      }
    }, 40);
    return () => clearInterval(id);
  }, []);

  /* ── Auto-scroll to bottom on new output ── */
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, input]);

  const print = useCallback((entries) => {
    setLines(prev => [...prev, ...entries]);
  }, []);

  const runCommand = useCallback((raw) => {
    const trimmed = raw.trim();
    print([{ type: 'input', text: raw }]);
    if (!trimmed) return;
    setHistory(prev => [...prev, trimmed]);

    const parts = trimmed.toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1];

    switch (cmd) {
      case 'help':
        print(COMMAND_LIST.map(([name, desc]) => ({
          type: 'output',
          text: `${name.padEnd(14)} ${desc}`,
        })));
        break;

      case 'about':
        print([
          { type: 'output', text: 'B.Tech CSE @ IIIT Vadodara — 3rd year, graduating 2028.' },
          { type: 'output', text: '15+ shipped projects across web, mobile, and AI.' },
          { type: 'output', text: 'Freelance client work: real-estate, sports venues, and more.' },
        ]);
        break;

      case 'skills':
        print(Object.entries(skills).map(([category, list]) => ({
          type: 'output',
          text: `${category.padEnd(10)} → ${list.join(', ')}`,
        })));
        break;

      case 'projects':
        print(projects.map(p => ({
          type: 'output',
          text: `${p.title.padEnd(16)} ${p.description.split('.')[0]}.`,
        })));
        break;

      case 'open': {
        if (!arg) {
          print([{ type: 'error', text: "usage: open <name> — try 'projects'" }]);
          break;
        }
        const url = OPEN_MAP[arg];
        if (url) {
          print([{ type: 'output', text: `Opening ${arg} → ${url}` }]);
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          print([{ type: 'error', text: `project not found. try 'projects'` }]);
        }
        break;
      }

      case 'github':
      case 'linkedin':
        print([{ type: 'output', text: `Opening ${cmd}...` }]);
        window.open(LINKS[cmd], '_blank', 'noopener,noreferrer');
        break;

      case 'email':
        print([{ type: 'output', text: 'Opening your mail client...' }]);
        window.location.href = LINKS.email;
        break;

      case 'whoami':
        print([{ type: 'output', text: 'guest@portfolio — nice try, but the admin seat is taken.' }]);
        break;

      case 'sudo':
        if (arg === 'hire-me') {
          print([{ type: 'output', text: 'Permission granted. Excellent decision — routing you to the contact page...' }]);
          setTimeout(() => navigate('/contact'), 800);
        } else {
          print([{ type: 'error', text: `sudo: only 'sudo hire-me' is permitted here.` }]);
        }
        break;

      case 'clear':
        setLines([]);
        break;

      default:
        print([{ type: 'error', text: `zsh: command not found: ${cmd}. Type 'help'.` }]);
    }
  }, [print, navigate]);

  /* ── Keyboard: Enter, history (↑/↓), Tab autocomplete ── */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
      setHistoryIndex(-1);
      draftRef.current = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      if (historyIndex === -1) draftRef.current = input;
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setInput(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(-1);
        setInput(draftRef.current);
      } else {
        setHistoryIndex(next);
        setInput(history[next]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const value = input.toLowerCase();
      if (!value) return;
      const matches = COMPLETIONS.filter(c => c.startsWith(value));
      if (matches.length === 1) {
        setInput(matches[0]);
      } else if (matches.length > 1) {
        const now = Date.now();
        const isDoubleTab = now - lastTabRef.current < 500;
        const prefix = commonPrefix(matches);
        if (prefix.length > value.length) {
          setInput(prefix);
        } else if (isDoubleTab) {
          print([
            { type: 'input', text: input },
            { type: 'output', text: matches.map(m => m.trim()).join('  ') },
          ]);
        }
        lastTabRef.current = now;
      }
    }
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto border border-card-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── Title bar ── */}
      <div className={`relative flex items-center px-4 h-9 border-b border-card-border transition-shadow duration-300 ${focused ? 'shadow-[inset_0_-1px_0_var(--color-accent)]' : ''}`}>
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] md:text-xs text-text-muted tracking-wider whitespace-nowrap">
          harshil@portfolio — zsh
        </span>
      </div>

      {/* ── Output + prompt ── */}
      <div
        ref={outputRef}
        className="font-mono text-xs md:text-sm leading-relaxed p-4 overflow-y-auto max-h-[320px] md:max-h-[420px] min-h-[220px] md:min-h-[280px]"
      >
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {line.type === 'input' ? (
              <span>
                <span className="text-accent">➜ ~ </span>
                <span className="text-text">{line.text}</span>
              </span>
            ) : (
              <span className={line.type === 'error' ? 'text-accent' : 'text-text-muted'}>{line.text}</span>
            )}
          </div>
        ))}

        {booted && (
          <div className="flex items-center whitespace-pre-wrap break-words">
            <span className="text-accent shrink-0">➜ ~ </span>
            <span className="text-text">{input}</span>
            <span className="term-cursor" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="absolute opacity-0 w-px h-px pointer-events-none"
              aria-label="Terminal input"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        )}
      </div>
    </div>
  );
}
