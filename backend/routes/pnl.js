const express = require('express');
const apiClient = require('./apiClient');
const router = express.Router();

// GET /api/pnl/:wallet
router.get('/:wallet', async (req, res) => {
  try {
    const response = await apiClient.get(`/pnl/${req.params.wallet}`, { params: req.query });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data?.message || err.message });
  }
});

module.exports = router;
