import http from 'k6/http';
import { check, fail } from 'k6';

const DEFAULT_BRANCH_ID = 'cmprvr9ck0000rgbkpw5bhn3m';

// Seed MenuItem tới đủ số lượng mong muốn (tạo dữ liệu thực tế trước khi load test)
//
// ENV:
//   BASE_URL=http://localhost:3000
//   BRANCH_ID=<branch id> (mặc định: cmprvr9ck0000rgbkpw5bhn3m)
//   TARGET=100           (tổng số MenuItem mong muốn trong branch)
//
// Chạy ví dụ:
//   k6 run --vus 1 --iterations 1 k6/menu-items-seed.js -e BASE_URL=http://localhost:3000 -e TARGET=100

export const options = {
  vus: 1,
  iterations: 1,
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
  return `${Date.now().toString(36)}${vu}${iter}${Math.floor(Math.random() * 1e9)}`;
}

function mustJson(res, label) {
  try {
    return res.json();
  } catch (e) {
    console.error(`${label} non-JSON: status=${res.status} body=${res.body}`);
    throw e;
  }
}

function listItems(baseUrl, branchId) {
  const res = http.get(
    `${baseUrl}/branches/${encodeURIComponent(branchId)}/menu/items`,
    jsonHeaders(),
  );

  const ok = check(res, {
    'list items: status 200': (r) => r.status === 200,
  });
  if (!ok) {
    console.error(`list items failed: status=${res.status} body=${res.body}`);
    fail('Cannot list menu items');
  }

  const body = mustJson(res, 'list items');
  const totalItems = body?.meta?.totalItems;
  if (typeof totalItems !== 'number') {
    console.error(
      `list items missing meta.totalItems: ${JSON.stringify(body)}`,
    );
    fail('List menu items missing meta.totalItems');
  }
  return { totalItems, data: Array.isArray(body?.data) ? body.data : [] };
}

function createItem(baseUrl, branchId, index) {
  const payload = {
    sku: `SEED-${randSuffix()}-${index}`.slice(0, 50),
    name: `Seed Item ${index} ${randSuffix()}`.slice(0, 200),
    description: 'Seeded by k6 for load testing',
    price: 10000 + (index % 50) * 500,
    isAvailable: true,
  };

  const res = http.post(
    `${baseUrl}/branches/${encodeURIComponent(branchId)}/menu/items`,
    JSON.stringify(payload),
    jsonHeaders(),
  );

  const ok = check(res, {
    'create item: status 201/200': (r) => r.status === 201 || r.status === 200,
  });

  if (!ok) {
    console.error(`create item failed: status=${res.status} body=${res.body}`);
    fail('Cannot create menu item');
  }
}

export default function () {
  const baseUrl = (__ENV.BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const branchId = __ENV.BRANCH_ID || DEFAULT_BRANCH_ID;
  const target = Number(__ENV.TARGET || 100);

  if (!branchId) fail('BRANCH_ID is required');
  if (!Number.isFinite(target) || target <= 0)
    fail('TARGET must be a positive number');

  const existing = listItems(baseUrl, branchId);
  const missing = Math.max(0, target - existing.totalItems);

  console.log(
    `Seeding menu items: branchId=${branchId} existing=${existing.totalItems} target=${target} toCreate=${missing}`,
  );

  for (let i = 0; i < missing; i++) {
    createItem(baseUrl, branchId, existing.length + i + 1);
  }

  const after = listItems(baseUrl, branchId);
  console.log(`Seed done: now=${after.totalItems}`);
}
