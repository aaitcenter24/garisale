import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Warm-up: ramp to 10 VUs
    { duration: '20s', target: 100 }, // Load: ramp to 100 VUs (target load)
    { duration: '30s', target: 100 }, // Sustained: hold 100 VUs
    { duration: '20s', target: 200 }, // Stress: double the load to 200 VUs
    { duration: '10s', target: 0 },   // Cool-down: ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed:   ['rate<0.001'],  // < 0.1% error rate
  },
};

export default function () {
  const queries = [
    '/api/v1/public/marketplace/search?make=Toyota&district=Dhaka',
    '/api/v1/public/marketplace/search?body_type=suv&price_max=2000000',
    '/api/v1/public/marketplace/search?fuel_type=hybrid&year_min=2018',
    '/api/v1/public/marketplace/search?deal_rating=great_deal&district=Dhaka',
  ];

  const query = queries[Math.floor(Math.random() * queries.length)];
  const params = {
    headers: {
      'x-bypass-rate-limit': 'true',
    },
  };
  const response = http.get(`http://localhost:3000${query}`, params);

  check(response, {
    'status 200':           (r) => r.status === 200,
    'response < 200ms':     (r) => r.timings.duration < 200,
  });

  sleep(0.1); // 100ms think time between requests
}
