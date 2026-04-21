import { useState, useEffect } from 'react';
import { getTrades } from '../api/client';
import { formatUsd, shortAddress, timeAgo } from '../api/helpers';
import Spinner from './Spinner';
import ErrorBox from './ErrorBox';
import clsx from 'clsx';

export default function TradesSection({ tokenAddress }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [hideArb, setHideArb] = useState(true);

  const load = async (append = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { hideArb, showMeta: true };
      if (append && cursor) params.cursor = cursor;
      const { data } = await getTrades(tokenAddress, params);
      setTrades(prev => append ? [...prev, ...(data.trades || [])] : (data.trades || []));
      setCursor(data.nextCursor);
      setHasMore(data.hasNextPage);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tokenAddress, hideArb]);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Recent Trades</h3>
        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideArb}
            onChange={e => setHideArb(e.target.checked)}
            className="accent-brand-500"
          />
          Hide Arb
        </label>
      </div>

      {error && <ErrorBox message={error} />}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left pb-2 text-xs text-slate-500 font-medium">Type</th>
              <th className="text-right pb-2 text-xs text-slate-500 font-medium">Amount</th>
              <th className="text-right pb-2 text-xs text-slate-500 font-medium">USD</th>
              <th className="text-right pb-2 text-xs text-slate-500 font-medium">Wallet</th>
              <th className="text-right pb-2 text-xs text-slate-500 font-medium">Time</th>
              <th className="text-right pb-2 text-xs text-slate-500 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={`${t.tx}-${i}`} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                <td className="py-2">
                  <span className={clsx('badge-green text-xs', t.type === 'sell' && 'badge-red')}>
                    {t.type?.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 text-right mono text-slate-300">{t.amount?.toFixed(2)}</td>
                <td className="py-2 text-right text-slate-300">{formatUsd(t.volume)}</td>
                <td className="py-2 text-right">
                  <a
                    href={`https://solscan.io/account/${t.wallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-xs text-brand-400 hover:text-brand-300"
                  >
                    {shortAddress(t.wallet)}
                  </a>
                </td>
                <td className="py-2 text-right text-xs text-slate-500">{timeAgo(t.time)}</td>
                <td className="py-2 text-right">
                  <a
                    href={`https://solscan.io/tx/${t.tx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono text-xs text-slate-600 hover:text-slate-400"
                  >
                    {shortAddress(t.tx, 4)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <div className="flex justify-center py-4"><Spinner /></div>}

      {!loading && trades.length === 0 && !error && (
        <div className="text-center py-6 text-slate-600 text-sm">No trades found</div>
      )}

      {hasMore && !loading && (
        <button onClick={() => load(true)} className="btn-ghost w-full text-sm">Load more</button>
      )}
    </div>
  );
}
