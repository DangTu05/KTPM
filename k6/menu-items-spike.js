import http from 'k6/http';
import { check, group, sleep } from 'k6';

const DEFAULT_BRANCH_ID = 'cmprvr9ck0000rgbkpw5bhn3m';

// Spike test — tăng đột ngột từ 0 lên max rồi giảm ngay
// Chạy ví dụ:
//   k6 run k6/menu-items-spike.js -e BASE_URL=http://localhost:3000

export const options = {
  stages: [
    { duration: '5s', target: 1500 },
    { duration: '30s', target: 1500 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
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
