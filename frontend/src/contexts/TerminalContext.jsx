import { createContext, useContext, useState } from 'react';

export const TERMINALS = [
  {
    id: 'axiom',
    label: 'Axiom',
    url: (mint) => `https://axiom.trade/t/${mint}`,
    favicon: 'https://axiom.trade/favicon.ico',
    hex: '#38bdf8',
    tw: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  },
  {
    id: 'gmgn',
    label: 'GMGN',
    url: (mint) => `https://gmgn.ai/sol/token/${mint}`,
    favicon: 'https://gmgn.ai/favicon.ico',
    hex: '#34d399',
    tw: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  },
  {
    id: 'padre',
    label: 'Padre',
    url: (mint) => `https://trade.padre.gg/trade/${mint}`,
    favicon: 'https://trade.padre.gg/favicon.ico',
    hex: '#fb923c',
    tw: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  },
  {
    id: 'pumpfun',
    label: 'Pump.fun',
    url: (mint) => `https://pump.fun/coin/${mint}`,
    favicon: 'https://pump.fun/favicon.ico',
    hex: '#c084fc',
    tw: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  },
];

const TerminalContext = createContext(null);

export function TerminalProvider({ children }) {
  const [terminalId, setTerminalId] = useState(
    () => localStorage.getItem('preferred_terminal') ?? 'axiom'
  );

  const setTerminal = (id) => {
    localStorage.setItem('preferred_terminal', id);
    setTerminalId(id);
  };

  const terminal = TERMINALS.find((t) => t.id === terminalId) ?? TERMINALS[0];

  return (
    <TerminalContext.Provider value={{ terminal, setTerminal, terminals: TERMINALS }}>
      {children}
    </TerminalContext.Provider>
  );
}

export const useTerminal = () => useContext(TerminalContext);
