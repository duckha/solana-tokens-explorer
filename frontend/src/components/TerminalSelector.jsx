import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTerminal } from '../contexts/TerminalContext';

function FaviconImg({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`${className} flex items-center justify-center bg-dark-600 rounded-sm text-[9px] font-bold text-slate-300`}>
        {alt[0]}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default function TerminalSelector() {
  const { terminal, setTerminal, terminals } = useTerminal();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-200 hover:bg-dark-700 border border-transparent hover:border-dark-500"
        title="Выбрать торговый терминал"
      >
        <FaviconImg src={terminal.favicon} alt={terminal.label} className="w-4 h-4 rounded-sm" />
        <span className={`hidden sm:inline text-xs font-semibold ${terminal.tw.text}`}>
          {terminal.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-dark-500 bg-dark-800 shadow-2xl shadow-black/50 py-1.5 z-50">
          <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Торговый терминал
          </p>
          {terminals.map((t) => {
            const active = t.id === terminal.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTerminal(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors
                  ${active
                    ? `${t.tw.bg} ${t.tw.text}`
                    : 'text-slate-300 hover:bg-dark-700 hover:text-slate-100'
                  }`}
              >
                <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center border ${t.tw.border} ${t.tw.bg}`}>
                  <FaviconImg src={t.favicon} alt={t.label} className="w-4 h-4 rounded-sm" />
                </span>
                <span className="font-medium">{t.label}</span>
                {active && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0`} style={{ background: t.hex }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
