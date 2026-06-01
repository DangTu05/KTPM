import { sleep } from 'k6';
import { createOrder, setupOrderFixture } from './orders-helpers.js';

export const options = {
  stages: [
    { duration: __ENV.IDLE || '30s', target: Number(__ENV.IDLE_VUS || 0) },
    {
      duration: __ENV.SPIKE_UP || '10s',
      target: Number(__ENV.SPIKE_VUS || 1000),
    },
    {
      duration: __ENV.SPIKE_HOLD || '1m',
      target: Number(__ENV.SPIKE_VUS || 1000),
    },
    { duration: __ENV.SPIKE_DOWN || '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<5000'],
    checks: ['rate>0.90'],
  },
};

export function setup() {
  return setupOrderFixture();
}

export default function (data) {
  createOrder(data, 'k6 spike');
  sleep(Number(__ENV.SLEEP || 0.05));
}
