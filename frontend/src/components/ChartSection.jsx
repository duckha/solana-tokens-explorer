import { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getChart } from '../api/client';
import { formatPrice, formatNumber } from '../api/helpers';
import Spinner from './Spinner';
import ErrorBox from './ErrorBox';

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

function formatTime(ts, interval) {
  const d = new Date(ts * 1000);
  if (['1d', '1w'].includes(interval)) return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

const CustomTooltip = ({ active, payload, label, interval }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-dark-800 border border-dark-500 rounded-lg p-3 text-xs shadow-xl space-y-1">
      <div className="text-slate-400">{formatTime(label, interval)}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
        {[['O', d?.open], ['H', d?.high], ['L', d?.low], ['C', d?.close]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-slate-500">{k}</span>
            <span className="text-slate-200 mono">{formatPrice(v)}</span>
          </div>
        ))}
        <div className="col-span-2 flex justify-between gap-2">
          <span className="text-slate-500">Vol</span>
          <span className="text-slate-200 mono">{formatNumber(d?.volume)}</span>
        </div>
      </div>
    </div>
  );
};

export default function ChartSection({ tokenAddress }) {
  const [interval, setInterval] = useState('15m');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tokenAddress) return;
    setLoading(true);
    setError(null);
    const now = Math.floor(Date.now() / 1000);
    const rangeSec = { '1m': 3600, '5m': 3600 * 6, '15m': 3600 * 24, '1h': 3600 * 72, '4h': 3600 * 168, '1d': 3600 * 24 * 30, '1w': 3600 * 24 * 180 };
    const from = now - (rangeSec[interval] || 86400);
    getChart(tokenAddress, { type: interval, time_from: from, time_to: now })
      .then(res => setData(res.data?.oclhv || []))
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [tokenAddress, interval]);

  const chartData = data.map(c => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    // For a simple line chart we use close price
    price: c.close,
  }));

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Price Chart (OHLCV)</h3>
        <div className="flex gap-1">
          {INTERVALS.map(iv => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                interval === iv ? 'bg-brand-500/20 text-brand-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><Spinner /></div>}
      {error && <ErrorBox message={error} />}
      {!loading && !error && chartData.length === 0 && (
        <div className="text-center py-10 text-slate-600 text-sm">No chart data available</div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222230" />
            <XAxis
              dataKey="time"
              tickFormatter={ts => formatTime(ts, interval)}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#2a2a3a' }}
              tickLine={false}
              minTickGap={60}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tickFormatter={v => formatPrice(v)}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <YAxis
              yAxisId="vol"
              orientation="left"
              tickFormatter={v => formatNumber(v)}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip interval={interval} />} />
            <Bar yAxisId="vol" dataKey="volume" fill="#22c55e" opacity={0.25} name="Volume" />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#22c55e"
              dot={false}
              strokeWidth={1.5}
              name="Close"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
