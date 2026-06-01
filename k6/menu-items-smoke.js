import http from 'k6/http';
import { check, group, sleep } from 'k6';

const DEFAULT_BRANCH_ID = 'cmprvr9ck0000rgbkpw5bhn3m';

// Smoke test — 1–5 VUs, 1–2 phút
// Chạy ví dụ:
//   k6 run k6/menu-items-smoke.js -e BASE_URL=http://localhost:3000
//   k6 run k6/menu-items-smoke.js -e BASE_URL=http://localhost:3000 -e BRANCH_ID=...

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '2m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

function jsonHeaders(extra = {}) {
  return {
    headers: {
      Accept: 'application/json',
      ...extra,
    },
  };
}

export function setup() {
  const baseUrl = (__ENV.BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const branchId = __ENV.BRANCH_ID || DEFAULT_BRANCH_ID;
  return { baseUrl, branchId };
}

export default function (data) {
  const { baseUrl, branchId } = data;

  group('GET menu items', () => {
    const res = http.get(
      `${baseUrl}/branches/${encodeURIComponent(branchId)}/menu/items`,
      jsonHeaders(),
    );

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
    });

    if (ok) {
      const body = res.json();
      check(body, {
        'body has data array': (b) => Array.isArray(b?.data),
      });
    }
  });

  sleep(0.2);
}
