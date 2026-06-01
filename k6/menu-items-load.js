import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';

const DEFAULT_BRANCH_ID = 'cmprvr9ck0000rgbkpw5bhn3m';

// Load test: GET menu items (thông tin sản phẩm)
// Endpoint hiện có trong code:
//   GET /branches/:branchId/menu/items
//
// ENV hỗ trợ:
//   BASE_URL=http://localhost:3000
//   BRANCH_ID=<id có sẵn>            (override branch mặc định)
//   SETUP_ITEMS=20                  (số sản phẩm tạo khi không có BRANCH_ID)
//
// Chạy ví dụ:
//   k6 run k6/menu-items-load.js -e BASE_URL=http://localhost:3000 -e BRANCH_ID=...
//   k6 run k6/menu-items-load.js -e BASE_URL=http://localhost:3000

export const options = {
  stages: [
    // Load test (bình thường): 100–500 VUs, tổng ~14 phút.
    { duration: '2m', target: 100 },
    { duration: '10m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

function jsonHeaders(extra = {}) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extra,
    },
  };
}

function randSuffix() {
  const vu = typeof __VU === 'undefined' ? 0 : __VU;
  const iter = typeof __ITER === 'undefined' ? 0 : __ITER;
  return `${Date.now().toString(36)}${vu}${iter}${Math.floor(Math.random() * 1e6)}`;
}

function mustJson(res, label) {
  let body;
  try {
    body = res.json();
  } catch (e) {
    console.error(
      `${label} non-JSON response: status=${res.status} body=${res.body}`,
    );
    throw e;
  }
  return body;
}

export function setup() {
  const baseUrl = (__ENV.BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );

  // Nếu bạn đã có branchId thật, dùng lại để load test ổn định và không "rác" DB.
  const branchId = __ENV.BRANCH_ID || DEFAULT_BRANCH_ID;
  if (branchId) {
    return { baseUrl, branchId };
  }

  // Nếu không có BRANCH_ID: tạo branch + một số menu item mẫu để endpoint list có dữ liệu.
  const branchCode = `K6${randSuffix()}`.slice(0, 50);
  const createBranchRes = http.post(
    `${baseUrl}/branches`,
    JSON.stringify({
      code: branchCode,
      name: `K6 Branch ${branchCode}`,
      addressLine: 'K6 Address',
      ward: 'Ward 1',
      district: 'District 1',
      province: 'HCM',
      country: 'VN',
      isActive: true,
    }),
    jsonHeaders(),
  );

  if (createBranchRes.status !== 201 && createBranchRes.status !== 200) {
    console.error(
      `create branch failed: status=${createBranchRes.status} body=${createBranchRes.body}`,
    );
    fail('setup: cannot create branch');
  }

  const branch = mustJson(createBranchRes, 'setup create branch');
  const newBranchId = branch?.id;
  if (!newBranchId) fail('setup: branch id missing');

  const setupItems = Number(__ENV.SETUP_ITEMS || 20);
  for (let i = 0; i < setupItems; i++) {
    const createItemRes = http.post(
      `${baseUrl}/branches/${newBranchId}/menu/items`,
      JSON.stringify({
        sku: `SKU-${randSuffix()}-${i}`.slice(0, 50),
        name: `K6 Item ${i} ${randSuffix()}`,
        description: 'Item for k6 menu-items load test',
        price: 12000 + (i % 10) * 1000,
        isAvailable: true,
      }),
      jsonHeaders(),
    );

    const ok = createItemRes.status === 201 || createItemRes.status === 200;
    if (!ok) {
      console.error(
        `create item failed: status=${createItemRes.status} body=${createItemRes.body}`,
      );
      fail('setup: cannot create menu item');
    }
  }

  return { baseUrl, branchId: newBranchId };
}

export default function (data) {
  const { baseUrl, branchId } = data;

  group('List products (menu items)', () => {
    const res = http.get(
      `${baseUrl}/branches/${encodeURIComponent(branchId)}/menu/items`,
      jsonHeaders(),
    );

    const ok = check(res, {
      'list menu items: status 200': (r) => r.status === 200,
    });

    if (!ok) return;

    const body = mustJson(res, 'list menu items');
    check(body, {
      'list menu items: has data array': (b) => Array.isArray(b?.data),
      'list menu items: has meta': (b) =>
        typeof b?.meta?.page === 'number' &&
        typeof b?.meta?.limit === 'number' &&
        typeof b?.meta?.totalItems === 'number',
    });
  });

  sleep(0.2);
}
