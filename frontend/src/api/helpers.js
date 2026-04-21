export function formatNumber(n, decimals = 2) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

export function formatUsd(n, decimals = 2) {
  if (n == null) return '—';
  return `$${formatNumber(n, decimals)}`;
}

export function formatPrice(n) {
  if (n == null) return '—';
  if (n < 0.000001) return `$${n.toExponential(2)}`;
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

export function formatPct(n) {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function pctColor(n) {
  if (n == null) return 'text-slate-400';
  if (n > 0) return 'text-green-400';
  if (n < 0) return 'text-red-400';
  return 'text-slate-400';
}

export function shortAddress(addr, len = 4) {
  if (!addr) return '—';
  return `${addr.slice(0, len)}...${addr.slice(-len)}`;
}

export function timeAgo(ts) {
  if (!ts) return '—';
  const seconds = Math.floor((Date.now() - ts * 1000) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function riskLevel(score) {
  if (score == null) return { label: 'Unknown', color: 'text-slate-400' };
  if (score <= 2) return { label: 'Low', color: 'text-green-400' };
  if (score <= 5) return { label: 'Medium', color: 'text-yellow-400' };
  return { label: 'High', color: 'text-red-400' };
}
