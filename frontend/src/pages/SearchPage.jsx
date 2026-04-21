import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ChevronDown, ChevronUp, X, Copy, Check,
  Twitter, MessageCircle, Globe, Github, Youtube, Facebook, Instagram
} from 'lucide-react';
import { searchTokens } from '../api/client';
import { formatUsd, formatNumber, riskLevel } from '../api/helpers';
import Spinner from '../components/Spinner';
import ErrorBox from '../components/ErrorBox';

// ─── constants ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  'createdAt','liquidityUsd','marketCapUsd','priceUsd','volume',
  'volume_5m','volume_15m','volume_30m','volume_1h','volume_6h','volume_12h','volume_24h',
  'top10','dev','insiders','snipers','holders','buys','sells','totalTransactions',
  'fees.total','fees.totalTrading','fees.totalTips','lpBurn','curvePercentage',
];

const VOLUME_TIMEFRAMES = ['5m','15m','30m','1h','6h','12h','24h'];
const STATUS_OPTIONS = ['', 'graduating', 'graduated', 'default'];

const LAUNCHPAD_OPTIONS = ['pumpfun','boop','moonshot','launchlab','bonk','believe','twokey'];
const MARKET_OPTIONS    = ['pumpfun','raydium','orca','meteora','jupiter','fluxbeam','lifinity'];

const DEFAULT_FILTERS = {
  symbol: '', format: '', limit: 30,
  sortBy: 'createdAt', sortOrder: 'desc',
  launchpad: '', market: '',
  status: '', showAllPools: '', showPriceChanges: '',
  minCreatedAt: '', maxCreatedAt: '', minGraduatedAt: '', maxGraduatedAt: '',
  minLiquidity: '', maxLiquidity: '', minMarketCap: '', maxMarketCap: '',
  minVolume: '', maxVolume: '', volumeTimeframe: '',
  minVolume_1h: '', maxVolume_1h: '', minVolume_6h: '', maxVolume_6h: '',
  minVolume_24h: '', maxVolume_24h: '',
  minBuys: '', maxBuys: '', minSells: '', maxSells: '',
  minTotalTransactions: '', maxTotalTransactions: '',
  minHolders: '', maxHolders: '', minTop10: '', maxTop10: '',
  minRiskScore: '', maxRiskScore: '',
  minDev: '', maxDev: '', minInsiders: '', maxInsiders: '',
  minSnipers: '', maxSnipers: '',
  minBundlers: '', maxBundlers: '', minBundlerPercentage: '', maxBundlerPercentage: '',
  minCurvePercentage: '', maxCurvePercentage: '', lpBurn: '',
  freezeAuthority: '', mintAuthority: '', deployer: '', creator: '',
  hasImage: '', hasSocials: '', image: '',
  twitter: '', telegram: '', discord: '', website: '',
  facebook: '', instagram: '', youtube: '', reddit: '', tiktok: '', github: '',
  minFeesTotal: '', maxFeesTotal: '', minFeesTrading: '', maxFeesTrading: '',
  minFeesTips: '', maxFeesTips: '',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function toUnixMs(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).getTime();
}

function cleanParams(query, filters) {
  const out = {};
  if (query.trim()) out.query = query.trim();
  for (const [k, v] of Object.entries(filters)) {
    if (v === '' || v == null) {
      // skip
    } else if (k === 'minCreatedAt' || k === 'maxCreatedAt' || k === 'minGraduatedAt' || k === 'maxGraduatedAt') {
      const ms = toUnixMs(v);
      if (ms) out[k] = ms;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function activeFilterCount(filters) {
  return Object.entries(filters).filter(([, v]) => v !== '' && v != null).length;
}

function totalFees(token) {
  const f = token.fees;
  if (!f) return null;
  const t = Number(f.total ?? 0);
  const tr = Number(f.totalTrading ?? 0);
  const ti = Number(f.totalTips ?? 0);
  if (t > 0) return t;
  if (tr > 0 || ti > 0) return tr + ti;
  return null;
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────

function MultiSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const toggle = (opt) => {
    const next = value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt];
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="input-base w-full text-left flex items-center justify-between gap-1 min-h-[36px]"
      >
        <span className="flex flex-wrap gap-1 flex-1 min-w-0">
          {value.length === 0
            ? <span className="text-slate-500">{placeholder ?? 'Any'}</span>
            : value.map(v => (
                <span key={v} className="bg-brand-500/20 text-brand-400 text-xs rounded px-1.5 py-0.5 flex items-center gap-1">
                  {v}
                  <span
                    onClick={e => { e.stopPropagation(); toggle(v); }}
                    className="cursor-pointer hover:text-white"
                  >×</span>
                </span>
              ))
          }
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-dark-800 border border-dark-500 rounded-lg shadow-xl overflow-hidden">
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-2 hover:bg-dark-600 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-brand-500"
              />
              <span className="text-slate-200">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── filter sub-components ────────────────────────────────────────────────────

function FilterGroup({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-dark-600 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-dark-700 hover:bg-dark-600 transition-colors text-sm font-medium text-slate-300"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>}
    </div>
  );
}

function FField({ label, children }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder }) {
  return <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '—'} className="input-base w-full" />;
}

function TextInput({ value, onChange, placeholder, mono }) {
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ''} className={`input-base w-full ${mono ? 'mono text-xs' : ''}`} />;
}

function SelectInput({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input-base w-full">
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{(o.label ?? o) || 'Any'}</option>
      ))}
    </select>
  );
}

// ─── social icons ─────────────────────────────────────────────────────────────

const SOCIAL_ICONS = {
  twitter:   { Icon: Twitter,        color: 'hover:text-sky-400' },
  telegram:  { Icon: MessageCircle,  color: 'hover:text-sky-500' },
  discord:   { Icon: MessageCircle,  color: 'hover:text-indigo-400' },
  website:   { Icon: Globe,          color: 'hover:text-slate-300' },
  github:    { Icon: Github,         color: 'hover:text-slate-300' },
  youtube:   { Icon: Youtube,        color: 'hover:text-red-500' },
  facebook:  { Icon: Facebook,       color: 'hover:text-blue-500' },
  instagram: { Icon: Instagram,      color: 'hover:text-pink-400' },
};

function SocialLinks({ token }) {
  const links = Object.entries(SOCIAL_ICONS)
    .filter(([k]) => token[k])
    .map(([k, { Icon, color }]) => (
      <a
        key={k}
        href={token[k]}
        target="_blank"
        rel="noreferrer"
        onClick={e => e.stopPropagation()}
        className={`text-slate-600 ${color} transition-colors`}
        title={k}
      >
        <Icon className="w-3.5 h-3.5" />
      </a>
    ));
  return links.length > 0 ? <div className="flex items-center gap-1.5 mt-1">{links}</div> : null;
}

// ─── copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0" title="Copy address">
      {copied ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q, f) => {
    const params = cleanParams(q, f);
    if (Object.keys(params).length === 0) { setResults(null); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await searchTokens(params);
      setResults(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val, filters), 450);
  };

  const handleFilterChange = (key) => (val) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, next), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    doSearch(query, filters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    clearTimeout(debounceRef.current);
    if (query.trim()) doSearch(query, DEFAULT_FILTERS);
  };

  const fCount = activeFilterCount(filters);
  const rows = results?.data ?? (Array.isArray(results) ? results : null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100 mb-1">Token Search</h1>
        <p className="text-sm text-slate-500">Search by name, symbol, address — or leave empty and use filters only</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={handleQueryChange}
            placeholder="Name, symbol, address... (optional)"
            className="input-base w-full pl-9"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2">
          {loading ? <Spinner size="sm" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">Search</span>
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className={`btn-ghost flex items-center gap-1.5 relative ${fCount > 0 ? 'text-brand-400' : ''}`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {fCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {fCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </form>

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{fCount} active filter{fCount !== 1 ? 's' : ''}</span>
            {fCount > 0 && (
              <button type="button" onClick={resetFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <X className="w-3 h-3" /> Reset all
              </button>
            )}
          </div>

          {/* Sort & Basic */}
          <FilterGroup title="Sort & Basic" defaultOpen>
            <FField label="Sort By">
              <SelectInput
                value={filters.sortBy}
                onChange={handleFilterChange('sortBy')}
                options={[{ value: '', label: 'Default' }, ...SORT_OPTIONS.map(v => ({ value: v, label: v }))]}
              />
            </FField>
            <FField label="Order">
              <SelectInput
                value={filters.sortOrder}
                onChange={handleFilterChange('sortOrder')}
                options={[{ value: 'desc', label: 'Descending' }, { value: 'asc', label: 'Ascending' }]}
              />
            </FField>
            <FField label="Symbol (exact)">
              <TextInput value={filters.symbol} onChange={handleFilterChange('symbol')} placeholder="e.g. BONK" />
            </FField>
            <FField label="Format">
              <SelectInput
                value={filters.format}
                onChange={handleFilterChange('format')}
                options={[{ value: '', label: 'Default' }, { value: 'full', label: 'Full (slower)' }]}
              />
            </FField>
            <FField label="Results per page">
              <SelectInput
                value={filters.limit}
                onChange={handleFilterChange('limit')}
                options={[20, 30, 50, 100].map(n => ({ value: n, label: String(n) }))}
              />
            </FField>
            <FField label="Show Price Changes">
              <SelectInput
                value={filters.showPriceChanges}
                onChange={handleFilterChange('showPriceChanges')}
                options={[{ value: '', label: 'No' }, { value: 'true', label: 'Yes' }]}
              />
            </FField>
          </FilterGroup>

          {/* Platform / Status */}
          <FilterGroup title="Platform & Status">
            <FField label="Launchpad">
              <TextInput value={filters.launchpad} onChange={handleFilterChange('launchpad')} placeholder="pumpfun,boop,moonshot" />
            </FField>
            <FField label="Market">
              <TextInput value={filters.market} onChange={handleFilterChange('market')} placeholder="raydium,orca,pumpfun" />
            </FField>
            <FField label="Status">
              <SelectInput
                value={filters.status}
                onChange={handleFilterChange('status')}
                options={STATUS_OPTIONS.map(v => ({ value: v, label: v || 'Any' }))}
              />
            </FField>
            <FField label="Show All Pools">
              <SelectInput
                value={filters.showAllPools}
                onChange={handleFilterChange('showAllPools')}
                options={[{ value: '', label: 'No' }, { value: 'true', label: 'Yes' }]}
              />
            </FField>
          </FilterGroup>

          {/* Dates */}
          <FilterGroup title="Dates">
            <FField label="Created After">
              <input type="date" value={filters.minCreatedAt} onChange={e => handleFilterChange('minCreatedAt')(e.target.value)} className="input-base w-full" />
            </FField>
            <FField label="Created Before">
              <input type="date" value={filters.maxCreatedAt} onChange={e => handleFilterChange('maxCreatedAt')(e.target.value)} className="input-base w-full" />
            </FField>
            <FField label="Graduated After">
              <input type="date" value={filters.minGraduatedAt} onChange={e => handleFilterChange('minGraduatedAt')(e.target.value)} className="input-base w-full" />
            </FField>
            <FField label="Graduated Before">
              <input type="date" value={filters.maxGraduatedAt} onChange={e => handleFilterChange('maxGraduatedAt')(e.target.value)} className="input-base w-full" />
            </FField>
          </FilterGroup>

          {/* Liquidity & Market Cap */}
          <FilterGroup title="Liquidity & Market Cap">
            <FField label="Min Liquidity ($)"><NumInput value={filters.minLiquidity} onChange={handleFilterChange('minLiquidity')} placeholder="0" /></FField>
            <FField label="Max Liquidity ($)"><NumInput value={filters.maxLiquidity} onChange={handleFilterChange('maxLiquidity')} placeholder="∞" /></FField>
            <FField label="Min Market Cap ($)"><NumInput value={filters.minMarketCap} onChange={handleFilterChange('minMarketCap')} placeholder="0" /></FField>
            <FField label="Max Market Cap ($)"><NumInput value={filters.maxMarketCap} onChange={handleFilterChange('maxMarketCap')} placeholder="∞" /></FField>
          </FilterGroup>

          {/* Volume */}
          <FilterGroup title="Volume">
            <FField label="Volume Timeframe">
              <SelectInput
                value={filters.volumeTimeframe}
                onChange={handleFilterChange('volumeTimeframe')}
                options={[{ value: '', label: 'Default' }, ...VOLUME_TIMEFRAMES.map(v => ({ value: v, label: v }))]}
              />
            </FField>
            <FField label="Min Volume ($)"><NumInput value={filters.minVolume} onChange={handleFilterChange('minVolume')} placeholder="0" /></FField>
            <FField label="Max Volume ($)"><NumInput value={filters.maxVolume} onChange={handleFilterChange('maxVolume')} placeholder="∞" /></FField>
            <div />
            <FField label="Min Vol 1h ($)"><NumInput value={filters.minVolume_1h} onChange={handleFilterChange('minVolume_1h')} /></FField>
            <FField label="Max Vol 1h ($)"><NumInput value={filters.maxVolume_1h} onChange={handleFilterChange('maxVolume_1h')} /></FField>
            <FField label="Min Vol 6h ($)"><NumInput value={filters.minVolume_6h} onChange={handleFilterChange('minVolume_6h')} /></FField>
            <FField label="Max Vol 6h ($)"><NumInput value={filters.maxVolume_6h} onChange={handleFilterChange('maxVolume_6h')} /></FField>
            <FField label="Min Vol 24h ($)"><NumInput value={filters.minVolume_24h} onChange={handleFilterChange('minVolume_24h')} /></FField>
            <FField label="Max Vol 24h ($)"><NumInput value={filters.maxVolume_24h} onChange={handleFilterChange('maxVolume_24h')} /></FField>
          </FilterGroup>

          {/* Transactions */}
          <FilterGroup title="Transactions">
            <FField label="Min Buys"><NumInput value={filters.minBuys} onChange={handleFilterChange('minBuys')} /></FField>
            <FField label="Max Buys"><NumInput value={filters.maxBuys} onChange={handleFilterChange('maxBuys')} /></FField>
            <FField label="Min Sells"><NumInput value={filters.minSells} onChange={handleFilterChange('minSells')} /></FField>
            <FField label="Max Sells"><NumInput value={filters.maxSells} onChange={handleFilterChange('maxSells')} /></FField>
            <FField label="Min Total Txns"><NumInput value={filters.minTotalTransactions} onChange={handleFilterChange('minTotalTransactions')} /></FField>
            <FField label="Max Total Txns"><NumInput value={filters.maxTotalTransactions} onChange={handleFilterChange('maxTotalTransactions')} /></FField>
          </FilterGroup>

          {/* Holders */}
          <FilterGroup title="Holders">
            <FField label="Min Holders"><NumInput value={filters.minHolders} onChange={handleFilterChange('minHolders')} /></FField>
            <FField label="Max Holders"><NumInput value={filters.maxHolders} onChange={handleFilterChange('maxHolders')} /></FField>
            <FField label="Min Top10 %"><NumInput value={filters.minTop10} onChange={handleFilterChange('minTop10')} placeholder="0–100" /></FField>
            <FField label="Max Top10 %"><NumInput value={filters.maxTop10} onChange={handleFilterChange('maxTop10')} placeholder="0–100" /></FField>
          </FilterGroup>

          {/* Risk */}
          <FilterGroup title="Risk & Distribution">
            <FField label="Min Risk Score"><NumInput value={filters.minRiskScore} onChange={handleFilterChange('minRiskScore')} /></FField>
            <FField label="Max Risk Score"><NumInput value={filters.maxRiskScore} onChange={handleFilterChange('maxRiskScore')} /></FField>
            <FField label="Min Dev %"><NumInput value={filters.minDev} onChange={handleFilterChange('minDev')} placeholder="0–100" /></FField>
            <FField label="Max Dev %"><NumInput value={filters.maxDev} onChange={handleFilterChange('maxDev')} placeholder="0–100" /></FField>
            <FField label="Min Insiders %"><NumInput value={filters.minInsiders} onChange={handleFilterChange('minInsiders')} placeholder="0–100" /></FField>
            <FField label="Max Insiders %"><NumInput value={filters.maxInsiders} onChange={handleFilterChange('maxInsiders')} placeholder="0–100" /></FField>
            <FField label="Min Snipers %"><NumInput value={filters.minSnipers} onChange={handleFilterChange('minSnipers')} placeholder="0–100" /></FField>
            <FField label="Max Snipers %"><NumInput value={filters.maxSnipers} onChange={handleFilterChange('maxSnipers')} placeholder="0–100" /></FField>
            <FField label="Min Bundlers"><NumInput value={filters.minBundlers} onChange={handleFilterChange('minBundlers')} /></FField>
            <FField label="Max Bundlers"><NumInput value={filters.maxBundlers} onChange={handleFilterChange('maxBundlers')} /></FField>
            <FField label="Min Bundler %"><NumInput value={filters.minBundlerPercentage} onChange={handleFilterChange('minBundlerPercentage')} placeholder="0–100" /></FField>
            <FField label="Max Bundler %"><NumInput value={filters.maxBundlerPercentage} onChange={handleFilterChange('maxBundlerPercentage')} placeholder="0–100" /></FField>
          </FilterGroup>

          {/* Curve & LP */}
          <FilterGroup title="Bonding Curve & LP">
            <FField label="Min Curve %"><NumInput value={filters.minCurvePercentage} onChange={handleFilterChange('minCurvePercentage')} placeholder="0–100" /></FField>
            <FField label="Max Curve %"><NumInput value={filters.maxCurvePercentage} onChange={handleFilterChange('maxCurvePercentage')} placeholder="0–100" /></FField>
            <FField label="LP Burn %"><NumInput value={filters.lpBurn} onChange={handleFilterChange('lpBurn')} placeholder="0–100" /></FField>
          </FilterGroup>

          {/* Fees */}
          <FilterGroup title="Fees (SOL)">
            <FField label="Min Total Fees"><NumInput value={filters.minFeesTotal} onChange={handleFilterChange('minFeesTotal')} /></FField>
            <FField label="Max Total Fees"><NumInput value={filters.maxFeesTotal} onChange={handleFilterChange('maxFeesTotal')} /></FField>
            <FField label="Min Trading Fees"><NumInput value={filters.minFeesTrading} onChange={handleFilterChange('minFeesTrading')} /></FField>
            <FField label="Max Trading Fees"><NumInput value={filters.maxFeesTrading} onChange={handleFilterChange('maxFeesTrading')} /></FField>
            <FField label="Min Tips"><NumInput value={filters.minFeesTips} onChange={handleFilterChange('minFeesTips')} /></FField>
            <FField label="Max Tips"><NumInput value={filters.maxFeesTips} onChange={handleFilterChange('maxFeesTips')} /></FField>
          </FilterGroup>

          {/* Addresses */}
          <FilterGroup title="Addresses">
            <FField label="Freeze Authority"><TextInput value={filters.freezeAuthority} onChange={handleFilterChange('freezeAuthority')} placeholder="address or 'null'" mono /></FField>
            <FField label="Mint Authority"><TextInput value={filters.mintAuthority} onChange={handleFilterChange('mintAuthority')} placeholder="address or 'null'" mono /></FField>
            <FField label="Deployer"><TextInput value={filters.deployer} onChange={handleFilterChange('deployer')} placeholder="wallet address" mono /></FField>
            <FField label="Creator"><TextInput value={filters.creator} onChange={handleFilterChange('creator')} placeholder="wallet address" mono /></FField>
          </FilterGroup>

          {/* Metadata & Socials */}
          <FilterGroup title="Metadata & Socials">
            <FField label="Has Image">
              <SelectInput value={filters.hasImage} onChange={handleFilterChange('hasImage')}
                options={[{ value: '', label: 'Any' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
            </FField>
            <FField label="Has Socials">
              <SelectInput value={filters.hasSocials} onChange={handleFilterChange('hasSocials')}
                options={[{ value: '', label: 'Any' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} />
            </FField>
            <FField label="Image URL / IPFS CID"><TextInput value={filters.image} onChange={handleFilterChange('image')} placeholder="URL or CID" /></FField>
            <div />
            {[['twitter','Twitter URL'],['telegram','Telegram URL'],['discord','Discord URL'],['website','Website URL'],
              ['github','GitHub URL'],['reddit','Reddit URL'],['youtube','YouTube URL'],['tiktok','TikTok URL'],
              ['instagram','Instagram URL'],['facebook','Facebook URL'],
            ].map(([k, label]) => (
              <FField key={k} label={label}><TextInput value={filters[k]} onChange={handleFilterChange(k)} placeholder="exact URL" /></FField>
            ))}
          </FilterGroup>
        </div>
      )}

      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {rows && !loading && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            {results?.total != null ? `${results.total.toLocaleString()} total` : `${rows.length} results`}
            {results?.page != null && ` — page ${results.page}`}
          </p>

          <div className="overflow-x-auto rounded-xl border border-dark-600">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600 bg-dark-800">
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Token</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Mkt Cap</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Vol 24h</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Total Fees</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Risk</th>
                  <th className="px-3 py-3 text-xs text-slate-500 font-medium text-center">Links</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((token, i) => {
                  const risk = riskLevel(token.riskScore);
                  const fees = totalFees(token);
                  const vol24 = token.volume24h ?? token.volume;
                  const mcap  = token.marketCapUsd ?? token.marketCap;

                  return (
                    <tr
                      key={token.mint || i}
                      className="border-b border-dark-700 hover:bg-dark-700/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/token/${token.mint}`)}
                    >
                      {/* Token info */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          {token.image ? (
                            <img src={token.image} alt="" className="w-8 h-8 rounded-full object-cover bg-dark-600 flex-shrink-0 mt-0.5"
                              onError={e => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-dark-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-100">{token.symbol}</span>
                              <span className="text-xs text-slate-500 truncate max-w-[100px]">{token.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="mono text-[11px] text-slate-600">
                                {token.mint ? `${token.mint.slice(0,4)}…${token.mint.slice(-4)}` : '—'}
                              </span>
                              {token.mint && <CopyBtn text={token.mint} />}
                            </div>
                            <SocialLinks token={token} />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right text-slate-200 font-medium">{formatUsd(mcap)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{formatUsd(vol24)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {fees != null ? `${fees.toFixed(2)} SOL` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${risk.color}`}>{risk.label}</td>

                      {/* Links */}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={`https://axiom.trade/t/${token.mint}?chain=sol`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors whitespace-nowrap"
                            title="Open in Axiom"
                          >
                            Axiom
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {results?.hasMore && (
            <button
              onClick={() => {
                const nextCursor = results.nextCursor;
                if (!nextCursor) return;
                setLoading(true);
                searchTokens({ ...cleanParams(query, filters), cursor: nextCursor })
                  .then(({ data }) => setResults(prev => ({
                    ...data,
                    data: [...(prev.data ?? []), ...(data.data ?? [])],
                  })))
                  .catch(e => setError(e.response?.data?.error || e.message))
                  .finally(() => setLoading(false));
              }}
              className="btn-ghost w-full mt-3 text-sm"
            >
              Load more
            </button>
          )}
        </div>
      )}

      {!loading && !results && !error && (
        <div className="text-center py-20 text-slate-600">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Type a search query or apply filters to find tokens</p>
        </div>
      )}
    </div>
  );
}
