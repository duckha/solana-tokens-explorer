const axios = require('axios');

const MIN_INTERVAL_MS = parseInt(process.env.API_MIN_INTERVAL_MS || '1100', 10);

const client = axios.create({
  baseURL: 'https://data.solanatracker.io',
  headers: {
    'x-api-key': process.env.SOLANA_TRACKER_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Serial queue: each request waits until the previous one finished + MIN_INTERVAL_MS
let queue = Promise.resolve();
let lastRequestTime = 0;

function enqueue(fn) {
  queue = queue.then(async () => {
    const now = Date.now();
    const wait = lastRequestTime + MIN_INTERVAL_MS - now;
    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    lastRequestTime = Date.now();
    return fn();
  });
  return queue;
}

const apiClient = {
  get: (url, config) => enqueue(() => client.get(url, config)),
  post: (url, data, config) => enqueue(() => client.post(url, data, config)),
};

module.exports = apiClient;
