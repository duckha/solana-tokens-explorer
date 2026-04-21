import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Search } from 'lucide-react';
import { getWallet } from '../api/client';
import { formatUsd, formatPrice, formatPct, pctColor, shortAddress } from '../api/helpers';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';

export default function WalletPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getWallet(address.trim());
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalUsd = data?.tokens?.reduce((sum, t) => sum + (t.value ?? 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100 mb-1">Wallet</h1>
        <p className="text-sm text-slate-500">View all tokens held in a Solana wallet</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Solana wallet address..."
          className="input-base flex-1 mono"
        />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Spinner size="sm" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">Look up</span>
        </button>
      </form>

      {error && <ErrorBox message={error} />}

      {data && (
        <div className="space-y-3">
          <div className="card flex items-center gap-3">
            <Wallet className="w-5 h-5 text-brand-400" />
            <div>
              <div className="text-xs text-slate-500">Total Portfolio Value</div>
              <div className="text-2xl font-bold text-slate-100">{formatUsd(totalUsd)}</div>
            </div>
            <div className="ml-auto text-xs text-slate-600 mono">{shortAddress(address, 8)}</div>
          </div>

          {(!data.tokens || data.tokens.length === 0) && (
            <div className="text-center py-8 text-slate-600">No tokens found in this wallet</div>
          )}

          {data.tokens?.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-dark-600">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600 bg-dark-800">
                    <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Token</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Balance</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Price</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">24h</th>
                    <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tokens.map((t, i) => {
                    const token = t.token ?? t;
                    const pool = t.pools?.[0];
                    const price = pool?.price?.usd ?? t.price;
                    const change24h = t.events?.['24h']?.priceChangePercentage;
                    const balance = t.balance ?? t.amount;
                    const value = t.value ?? (price && balance ? price * balance : null);
                    return (
                      <tr
                        key={token?.mint ?? i}
                        className="border-b border-dark-700 hover:bg-dark-700/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/token/${token?.mint}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {token?.image ? (
                              <img src={token.image} alt="" className="w-7 h-7 rounded-full object-cover bg-dark-600" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-dark-600" />
                            )}
                            <div>
                              <div className="font-semibold text-slate-100">{token?.symbol ?? '—'}</div>
                              <div className="text-xs text-slate-500 truncate max-w-[100px]">{token?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right mono text-slate-300">
                          {balance != null ? Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right mono text-slate-200">{formatPrice(price)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${pctColor(change24h)}`}>{formatPct(change24h)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-100">{formatUsd(value)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
