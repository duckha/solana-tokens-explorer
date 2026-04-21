import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Search } from 'lucide-react';
import { getPnl } from '../api/client';
import { formatUsd, formatNumber, shortAddress } from '../api/helpers';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';

function PnlBadge({ value }) {
  if (value == null) return <span className="text-slate-500">—</span>;
  const cls = value >= 0 ? 'text-green-400' : 'text-red-400';
  const sign = value > 0 ? '+' : '';
  return <span className={`font-semibold ${cls}`}>{sign}{formatUsd(value)}</span>;
}

export default function PnlPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistoric, setShowHistoric] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getPnl(address.trim(), { showHistoricPnL: showHistoric, holdingCheck: true });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary;
  const tokens = data?.tokens ? Object.entries(data.tokens) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100 mb-1">PnL</h1>
        <p className="text-sm text-slate-500">Profit & Loss analysis for a wallet</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Solana wallet address..."
          className="input-base flex-1 mono min-w-[200px]"
        />
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer self-center">
          <input
            type="checkbox"
            checked={showHistoric}
            onChange={e => setShowHistoric(e.target.checked)}
            className="accent-brand-500"
          />
          Historic (1d/7d/30d)
        </label>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner size="sm" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">Analyze</span>
        </button>
      </form>

      {error && <ErrorBox message={error} />}

      {summary && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Realized', summary.realized],
              ['Unrealized', summary.unrealized],
              ['Total PnL', summary.total],
              ['Total Invested', summary.totalInvested],
            ].map(([label, val]) => (
              <div key={label} className="card">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <PnlBadge value={val} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Wins', summary.totalWins, 'text-green-400'],
              ['Losses', summary.totalLosses, 'text-red-400'],
              ['Win Rate', summary.winPercentage != null ? `${summary.winPercentage.toFixed(1)}%` : '—', 'text-slate-100'],
              ['Avg Buy', summary.averageBuyAmount != null ? formatUsd(summary.averageBuyAmount) : '—', 'text-slate-100'],
            ].map(([label, val, cls]) => (
              <div key={label} className="card">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className={`text-lg font-bold ${cls}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Token breakdown */}
          {tokens.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-dark-600">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600 bg-dark-800">
                    <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Token</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Realized</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Unrealized</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Total</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Invested</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Txns</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map(([mint, t]) => (
                    <tr
                      key={mint}
                      className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/token/${mint}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="mono text-xs text-brand-400">{shortAddress(mint)}</span>
                      </td>
                      <td className="px-4 py-3 text-right"><PnlBadge value={t.realized} /></td>
                      <td className="px-4 py-3 text-right"><PnlBadge value={t.unrealized} /></td>
                      <td className="px-4 py-3 text-right"><PnlBadge value={t.total} /></td>
                      <td className="px-4 py-3 text-right text-slate-300">{formatUsd(t.total_invested)}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{t.total_transactions ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-slate-600">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Enter a wallet address to see PnL</p>
        </div>
      )}
    </div>
  );
}
