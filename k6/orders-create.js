import http from 'k6/http';
import { check, sleep, fail } from 'k6';

// =============================
// Cấu hình k6
// - `vus`, `duration`: mức tải mặc định (có thể override bằng CLI: --vus, --duration)
// - `thresholds`: tiêu chí pass/fail cho bài test
// =============================
export const options = {
  // Default: small smoke-ish run. Override via CLI flags: --vus, --duration, --iterations, etc.
  vus: 1,
  duration: '5s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

// =============================
// Helper: header JSON chuẩn cho API NestJS
// =============================
function jsonHeaders() {
  return {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
}

// =============================
// Helper: tạo chuỗi suffix để random dữ liệu
// - Dùng để tránh trùng code/sku/name khi chạy nhiều VU
// - `__VU`, `__ITER` có trong lúc chạy VU; riêng `setup()` có thể không có
// =============================
function randSuffix() {
  const vu = typeof __VU === 'undefined' ? 0 : __VU;
  const iter = typeof __ITER === 'undefined' ? 0 : __ITER;
  return `${Date.now().toString(36)}${vu}${iter}${Math.floor(Math.random() * 1e6)}`;
}

// =============================
// Helper: parse JSON response an toàn
// - Nếu API trả không phải JSON thì log body để debug
// =============================
function mustJson(res, label) {
  let body;
  try {
    body = res.json();
  } catch {
    console.error(
      `${label} non-JSON response: status=${res.status} body=${res.body}`,
    );
    return null;
  }
  return body;
}

// =============================
// setup(): chạy 1 lần trước khi bắt đầu load
// Mục tiêu:
// - Có `branchId` và `menuItemId` hợp lệ để tạo order
// Cách làm:
// - Nếu bạn truyền env `BRANCH_ID` + `MENU_ITEM_ID` => dùng lại (khuyên dùng để tránh tạo nhiều dữ liệu)
// - Nếu không có => gọi API tạo mới Branch và MenuItem
// Kết quả: trả về object được truyền vào `default(data)`
// =============================
export function setup() {
  const baseUrl = (__ENV.BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );

  // Prefer pre-existing IDs (recommended for load tests to avoid DB pollution)
  const envBranchId = __ENV.BRANCH_ID;
  const envMenuItemId = __ENV.MENU_ITEM_ID;
  if (envBranchId && envMenuItemId) {
    return { baseUrl, branchId: envBranchId, menuItemId: envMenuItemId };
  }

  // Otherwise, create minimal fixtures via API.
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
  const branchId = branch?.id;
  if (!branchId) fail('setup: branch id missing');

  const createItemRes = http.post(
    `${baseUrl}/branches/${branchId}/menu/items`,
    JSON.stringify({
      sku: `SKU-${randSuffix()}`.slice(0, 50),
      name: `K6 Item ${randSuffix()}`,
      description: 'Item for k6 create-order test',
      price: 12000,
      isAvailable: true,
    }),
    jsonHeaders(),
  );

  if (createItemRes.status !== 201 && createItemRes.status !== 200) {
    console.error(
      `create item failed: status=${createItemRes.status} body=${createItemRes.body}`,
    );
    fail('setup: cannot create menu item');
  }

  const item = mustJson(createItemRes, 'setup create item');
  const menuItemId = item?.id;
  if (!menuItemId) fail('setup: menuItemId missing');

  return { baseUrl, branchId, menuItemId };
}

// =============================
// default(): chạy lặp lại theo VU trong suốt thời gian test
// Mục tiêu: chỉ test API tạo order (POST /orders)
// - Tạo payload hợp lệ theo CreateOrderDto
// - Gửi request
// - Check status + check response có `id`
// =============================
export default function (data) {
  const { baseUrl, branchId, menuItemId } = data;

  // Payload tối thiểu để tạo order
  // Lưu ý: `branchId` và `menuItemId` phải tồn tại trong DB
  const payload = {
    branchId,
    paymentMethod: 'CASH',
    customerName: `K6 Customer ${randSuffix()}`,
    customerPhone: '0000000000',
    items: [
      { menuItemId, quantity: 1 + (__ITER % 3), note: 'k6 create order' },
    ],
    discount: 0,
    tax: 0,
    shippingFee: 0,
  };

  // Gọi API tạo order
  const res = http.post(
    `${baseUrl}/orders`,
    JSON.stringify(payload),
    jsonHeaders(),
  );

  // Check cơ bản: API trả status 201/200
  const ok = check(res, {
    'create order: status 201/200': (r) => r.status === 201 || r.status === 200,
  });

  // Nếu ok thì parse JSON và check có trường `id`
  if (ok) {
    const body = mustJson(res, 'create order');
    check(body || {}, {
      'create order: has id': (b) =>
        typeof b.id === 'string' && b.id.length > 0,
    });
  }

  // Nghỉ một chút để tránh bắn “max speed” và mô phỏng hành vi user tự nhiên hơn
  sleep(0.2);
}
