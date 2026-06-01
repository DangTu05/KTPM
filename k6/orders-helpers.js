import http from 'k6/http';
import { check, fail } from 'k6';

export function getBaseUrl() {
  return (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function jsonHeaders(extra = {}) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extra,
    },
  };
}

export function randSuffix() {
  const vu = typeof __VU === 'undefined' ? 0 : __VU;
  const iter = typeof __ITER === 'undefined' ? 0 : __ITER;
  return `${Date.now().toString(36)}${vu}${iter}${Math.floor(Math.random() * 1e6)}`;
}

export function mustJson(res, label) {
  try {
    return res.json();
  } catch (err) {
    console.error(
      `${label} non-JSON response: status=${res.status} body=${res.body}`,
    );
    throw err;
  }
}

export function setupOrderFixture() {
  const baseUrl = getBaseUrl();
  const envBranchId = __ENV.BRANCH_ID;
  const envMenuItemId = __ENV.MENU_ITEM_ID;

  if (envBranchId && envMenuItemId) {
    return { baseUrl, branchId: envBranchId, menuItemId: envMenuItemId };
  }

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
      `setup branch failed: status=${createBranchRes.status} body=${createBranchRes.body}`,
    );
    fail('setup: cannot create branch');
  }

  const branch = mustJson(createBranchRes, 'setup branch');
  const branchId = branch.id;
  if (!branchId) fail('setup: branch id missing');

  const createItemRes = http.post(
    `${baseUrl}/branches/${branchId}/menu/items`,
    JSON.stringify({
      sku: `SKU-${randSuffix()}`.slice(0, 50),
      name: `K6 Item ${randSuffix()}`,
      description: 'Item for k6 order tests',
      price: 12000,
      isAvailable: true,
    }),
    jsonHeaders(),
  );

  if (createItemRes.status !== 201 && createItemRes.status !== 200) {
    console.error(
      `setup menu item failed: status=${createItemRes.status} body=${createItemRes.body}`,
    );
    fail('setup: cannot create menu item');
  }

  const item = mustJson(createItemRes, 'setup menu item');
  const menuItemId = item.id;
  if (!menuItemId) fail('setup: menu item id missing');

  return { baseUrl, branchId, menuItemId };
}

export function buildOrderPayload(branchId, menuItemId, label = 'k6 order') {
  return {
    branchId,
    channel: 'WEB',
    fulfillment: 'DELIVERY',
    paymentMethod: 'CASH',
    customerName: `K6 Customer ${randSuffix()}`,
    customerPhone: '0000000000',
    deliveryAddressLine: 'K6 Address',
    deliveryWard: 'Ward 1',
    deliveryDistrict: 'District 1',
    deliveryProvince: 'HCM',
    deliveryNote: label,
    items: [
      {
        menuItemId,
        quantity: 1 + (__ITER % 3),
        note: label,
      },
    ],
    discount: 0,
    tax: 0,
    shippingFee: 0,
  };
}

export function createOrder(data, label) {
  const res = http.post(
    `${data.baseUrl}/orders`,
    JSON.stringify(buildOrderPayload(data.branchId, data.menuItemId, label)),
    jsonHeaders(),
  );

  const ok = check(res, {
    'create order: status 201/200': (r) => r.status === 201 || r.status === 200,
  });

  if (!ok) {
    console.error(`create order failed: status=${res.status} body=${res.body}`);
    return null;
  }

  const body = mustJson(res, 'create order');
  check(body, {
    'create order: has id': (b) => typeof b?.id === 'string' && b.id.length > 0,
  });

  return body;
}
