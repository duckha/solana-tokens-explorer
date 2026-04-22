require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const searchRoutes = require('./routes/search');
const tokensRoutes = require('./routes/tokens');
const priceRoutes = require('./routes/price');
const walletRoutes = require('./routes/wallet');
const tradesRoutes = require('./routes/trades');
const chartRoutes = require('./routes/chart');
const pnlRoutes = require('./routes/pnl');
const topTradersRoutes = require('./routes/topTraders');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use('/api/search', searchRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/chart', chartRoutes);
app.use('/api/pnl', pnlRoutes);
app.use('/api/top-traders', topTradersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
