import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, RefreshCw } from 'lucide-react';
import { getTopTraders } from '../api/client';
import { formatUsd, formatNumber, shortAddress } from '../api/helpers';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';

function PnlBadge({ value }) {
  if (value == null) return <span className="text-slate-500">—</span>;
  const cls = value >= 0 ? 'text-green-400' : 'text-red-400';
  const sign = value > 0 ? '+' : '';
  return <span className={`font-semibold ${cls}`}>{sign}{formatUsd(value)}</span>;
}

const MEDAL = { 0: '🥇', 1: '🥈', 2: '🥉' };

export default function TopTradersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('total');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTopTraders({ sortBy, expandPnl: false });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [sortBy]);

  const wallets = data?.wallets ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 mb-1">Top Traders</h1>
          <p className="text-sm text-slate-500">Best performing traders on Solana</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-xs text-slate-500">Sort by:</span>
        {[
          { value: 'total', label: 'Total PnL' },
          { value: 'winPercentage', label: 'Win Rate' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sortBy === opt.value ? 'bg-brand-500/20 text-brand-400' : 'btn-ghost'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && wallets.length === 0 && !error && (
        <div className="text-center py-20 text-slate-600">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No data available</p>
        </div>
      )}

      {!loading && wallets.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-dark-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600 bg-dark-800">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium w-10">#</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Wallet</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Realized</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Unrealized</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Total PnL</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Invested</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Wins</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Losses</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w, i) => {
                const s = w.summary ?? {};
                return (
                  <tr
                    key={w.wallet}
                    className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/pnl?wallet=${w.wallet}`)}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg">{MEDAL[i] ?? <span className="text-slate-600 text-sm">{i + 1}</span>}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="mono text-xs text-brand-400">{shortAddress(w.wallet, 6)}</span>
                    </td>
                    <td className="px-4 py-3 text-right"><PnlBadge value={s.realized} /></td>
                    <td className="px-4 py-3 text-right"><PnlBadge value={s.unrealized} /></td>
                    <td className="px-4 py-3 text-right"><PnlBadge value={s.total} /></td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatUsd(s.totalInvested)}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">{s.totalWins ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-medium">{s.totalLosses ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {s.winPercentage != null ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 bg-dark-600 rounded-full h-1.5">
                            <div
                              className="bg-brand-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, s.winPercentage)}%` }}
                            />
                          </div>
                          <span className="text-slate-200 text-xs">{s.winPercentage.toFixed(1)}%</span>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
