const http = require('http');
const https = require('https');
const { URL } = require('url');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

/**
 * Generic API call function using Node.js http/https modules
 */
async function callAPI(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + endpoint);
    const httpModule = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = httpModule.request(options, (res) => {
      let responseData = '';

      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const errorMessage = parsed.message || parsed.error || `HTTP ${res.statusCode}`;
            reject(new Error(errorMessage));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        reject(new Error(`Cannot connect to backend API. Make sure it is running at ${API_BASE_URL}`));
      } else {
        reject(new Error(`API request failed: ${err.message}`));
      }
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Request timeout: Backend API not responding at ${API_BASE_URL}`));
    });

    if (data && (method === 'POST' || method === 'PUT')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Register new user
 * Returns backend response or throws error
 */
async function register(userData) {
  return callAPI('POST', '/api/users/register', userData);
}

/**
 * Login user
 */
async function login(email, password) {
  return callAPI('POST', '/api/users/login', { email, password });
}

module.exports = {
  register,
  login
};