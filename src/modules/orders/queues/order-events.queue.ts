export const ORDER_EVENTS_QUEUE = 'order-events';

export type OrderCreatedJob = {
  orderId: string;
  branchId: string;
  customerId?: string;
  total: string;
  itemCount: number;
  placedAt: string;
};

export const ORDER_CREATED_JOB = 'order.created';
