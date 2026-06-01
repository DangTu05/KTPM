import { group, sleep } from 'k6';
import { createOrder, setupOrderFixture } from './orders-helpers.js';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.99'],
  },
};

export function setup() {
  return setupOrderFixture();
}

export default function (data) {
  group('create order', () => {
    createOrder(data, 'k6 smoke');
  });

  sleep(1);
}
