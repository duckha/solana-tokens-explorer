const express = require('express');
const apiClient = require('./apiClient');
const router = express.Router();

// GET /api/top-traders/all
router.get('/all', async (req, res) => {
  try {
    const response = await apiClient.get('/top-traders/all', { params: req.query });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data?.message || err.message });
  }
});

module.exports = router;
