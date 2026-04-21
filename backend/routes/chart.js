const express = require('express');
const apiClient = require('./apiClient');
const router = express.Router();

// GET /api/chart/:token
router.get('/:token', async (req, res) => {
  try {
    const response = await apiClient.get(`/chart/${req.params.token}`, { params: req.query });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data?.message || err.message });
  }
});

module.exports = router;
