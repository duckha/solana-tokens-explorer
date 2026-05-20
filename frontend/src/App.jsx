import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import TokenPage from './pages/TokenPage';
import WalletPage from './pages/WalletPage';
import PnlPage from './pages/PnlPage';
import TopTradersPage from './pages/TopTradersPage';
import { TerminalProvider } from './contexts/TerminalContext';

export default function App() {
  return (
    <TerminalProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/token/:address" element={<TokenPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/pnl" element={<PnlPage />} />
          <Route path="/top-traders" element={<TopTradersPage />} />
        </Routes>
      </Layout>
    </TerminalProvider>
  );
}
