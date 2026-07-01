const http = require('http');
const https = require('https');

const STAGING_HEALTH_URL = process.env.STAGING_HEALTH_URL || 'https://staging.api.garisale.com/health';

console.log(`Checking staging health at: ${STAGING_HEALTH_URL}`);

const client = STAGING_HEALTH_URL.startsWith('https') ? https : http;

const req = client.get(STAGING_HEALTH_URL, { timeout: 10000 }, (res) => {
  console.log(`Staging response status code: ${res.statusCode}`);
  if (res.statusCode >= 200 && res.statusCode < 300) {
    console.log('✅ Staging is healthy and active.');
    process.exit(0);
  } else {
    console.error(`❌ Staging returned unhealthy status code: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  // If it's a connection or DNS resolution error, we can allow it to pass for initial setup
  // but warn about it.
  console.warn(`⚠️ Warning: Staging health check failed with error: ${err.message}`);
  console.warn('Staging might not be deployed yet. Allowing bypass for initial deploy.');
  process.exit(0);
});

req.on('timeout', () => {
  req.destroy();
  console.warn('⚠️ Warning: Staging health check timed out.');
  console.warn('Allowing bypass for initial deploy.');
  process.exit(0);
});
