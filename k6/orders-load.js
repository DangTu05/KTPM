import { group, sleep } from 'k6';
import { createOrder, setupOrderFixture } from './orders-helpers.js';

export const options = {
  stages: [
    { duration: __ENV.RAMP_UP || '2m', target: Number(__ENV.VUS || 200) },
    { duration: __ENV.STEADY || '10m', target: Number(__ENV.VUS || 200) },
    { duration: __ENV.RAMP_DOWN || '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  return setupOrderFixture();
}

export default function (data) {
  group('create order', () => {
    createOrder(data, 'k6 load');
  });

  sleep(Number(__ENV.SLEEP || 0.2));
}
