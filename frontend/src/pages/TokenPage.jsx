import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Twitter, MessageCircle, Globe, Activity } from 'lucide-react';
import { getToken } from '../api/client';
import { formatUsd, formatPrice, formatPct, formatNumber, pctColor, shortAddress, riskLevel } from '../api/helpers';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';
import ErrorBoundary from '../components/ErrorBoundary';
import ChartSection from '../components/ChartSection';
import TradesSection from '../components/TradesSection';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '24h'];

export default function TokenPage() {
  const { address } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('chart');

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    getToken(address)
      .then(res => setData(res.data))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [address]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );
  if (error) return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1.5 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <ErrorBox message={error} />
    </div>
  );
  if (!data) return null;

  const { token, pools, events, risk, buys, sells, txns, holders } = data;
  const pool = pools?.[0];
  const price = pool?.price?.usd;
  const liquidity = pool?.liquidity?.usd;
  const marketCap = pool?.marketCap?.usd;
  const rl = riskLevel(risk?.score);

  return (
    <ErrorBoundary>
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-1.5 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1">
          {token?.image ? (
            <img src={token.image} alt="" className="w-12 h-12 rounded-full object-cover bg-dark-600" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-dark-600" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{token?.symbol}</h1>
              <span className="text-sm text-slate-500">{token?.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="mono text-xs text-slate-500">{shortAddress(address, 6)}</span>
              <button onClick={copyAddress} className="text-slate-600 hover:text-slate-400 transition-colors">
                <Copy className="w-3 h-3" />
              </button>
              {copied && <span className="text-xs text-brand-400">Copied!</span>}
              {pool?.market && (
                <span className="badge-yellow">{pool.market}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-start">
          {token?.twitter && (
            <a href={token.twitter} target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
              <Twitter className="w-3.5 h-3.5" /> Twitter
            </a>
          )}
          {token?.telegram && (
            <a href={token.telegram} target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> Telegram
            </a>
          )}
          {token?.website && (
            <a href={token.website} target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          )}
          <a
            href={`https://solscan.io/token/${address}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Solscan
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Price" value={formatPrice(price)} />
        <StatCard label="Market Cap" value={formatUsd(marketCap)} />
        <StatCard label="Liquidity" value={formatUsd(liquidity)} />
        <StatCard label="Holders" value={formatNumber(holders, 0)} />
        <StatCard label="Buys" value={formatNumber(buys, 0)} valueClass="text-green-400" />
        <StatCard label="Sells" value={formatNumber(sells, 0)} valueClass="text-red-400" />
        <StatCard label="Total Txns" value={formatNumber(txns, 0)} />
        <StatCard
          label="Risk"
          value={rl.label}
          valueClass={rl.color}
          sub={risk?.score != null ? `Score: ${risk.score}` : undefined}
        />
      </div>

      {/* Price Changes */}
      {events && (
        <div className="card">
          <h3 className="text-xs text-slate-500 font-medium mb-3">Price Changes</h3>
          <div className="flex flex-wrap gap-2">
            {TIMEFRAMES.map(tf => {
              const val = events[tf]?.priceChangePercentage != null ? Number(events[tf].priceChangePercentage) : null;
              if (val == null) return null;
              return (
                <div key={tf} className="bg-dark-700 rounded-lg px-3 py-2 text-center min-w-[60px]">
                  <div className="text-xs text-slate-500 mb-0.5">{tf}</div>
                  <div className={`text-sm font-semibold ${pctColor(val)}`}>{formatPct(val)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Info */}
      {risk && (
        <div className="card">
          <h3 className="text-xs text-slate-500 font-medium mb-3">Risk Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ['Top 10 Holders', risk.top10 != null ? `${Number(risk.top10).toFixed(1)}%` : '—'],
              ['Dev Holdings', risk.dev != null ? `${Number(risk.dev).toFixed(1)}%` : '—'],
              ['Insiders', risk.insiders != null ? `${Number(risk.insiders).toFixed(1)}%` : '—'],
              ['Snipers', risk.snipers != null ? `${Number(risk.snipers).toFixed(1)}%` : '—'],
              ['Bundlers', risk.bundlers != null ? `${risk.bundlers}` : '—'],
              ['Rug Pull', risk.rugPull != null ? (risk.rugPull ? 'Yes' : 'No') : '—'],
              ['Freeze Auth', risk.freezeAuthority != null ? (risk.freezeAuthority ? 'Yes' : 'No') : '—'],
              ['Mint Auth', risk.mintAuthority != null ? (risk.mintAuthority ? 'Yes' : 'No') : '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-dark-700 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-500">{k}</div>
                <div className="font-medium text-slate-200 mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs: Chart / Trades */}
      <div className="flex gap-1 border-b border-dark-600">
        {['chart', 'trades'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'chart' && <ChartSection tokenAddress={address} />}
      {tab === 'trades' && <TradesSection tokenAddress={address} />}
    </div>
    </ErrorBoundary>
  );
}

function StatCard({ label, value, valueClass = 'text-slate-100', sub }) {
  return (
    <div className="card">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${valueClass}`}>{value}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}
