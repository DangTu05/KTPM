import { sleep } from 'k6';
import { createOrder, setupOrderFixture } from './orders-helpers.js';

export const options = {
  stages: [
    { duration: __ENV.RAMP_1 || '2m', target: Number(__ENV.VUS_1 || 500) },
    { duration: __ENV.HOLD_1 || '5m', target: Number(__ENV.VUS_1 || 500) },
    { duration: __ENV.RAMP_2 || '2m', target: Number(__ENV.VUS_2 || 1000) },
    { duration: __ENV.HOLD_2 || '5m', target: Number(__ENV.VUS_2 || 1000) },
    { duration: __ENV.RAMP_3 || '2m', target: Number(__ENV.VUS_3 || 2000) },
    { duration: __ENV.HOLD_3 || '5m', target: Number(__ENV.VUS_3 || 2000) },
    { duration: __ENV.RAMP_DOWN || '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    checks: ['rate>0.95'],
  },
};

export function setup() {
  return setupOrderFixture();
}

export default function (data) {
  createOrder(data, 'k6 stress');
  sleep(Number(__ENV.SLEEP || 0.1));
}
