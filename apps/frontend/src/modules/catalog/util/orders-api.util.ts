import Cookies from 'js-cookie';

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderSummary = {
  id: string;
  code: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  paymentConfirmed: boolean;
  createdAt: string;
};

export type OrderPage = {
  items: OrderSummary[];
  total: number;
  page: number;
  perPage: number;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class OrdersApiError extends Error {
  readonly statusCode: number;
  readonly errors: string[];

  constructor(statusCode: number, errors: string[]) {
    super(errors[0] ?? 'DEFAULT_API_ERROR');
    this.statusCode = statusCode;
    this.errors = errors.length > 0 ? errors : ['DEFAULT_API_ERROR'];
  }
}

const COOKIE_NAME = 'auth_token';

function getApiUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

function authHeaders(): Record<string, string> {
  const token = Cookies.get(COOKIE_NAME);
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(response: Response): Promise<OrdersApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new OrdersApiError(response.status, errors);
}

export async function listOrders(page: number, perPage: number): Promise<OrderPage> {
  const response = await fetch(getApiUrl(`/orders?page=${page}&perPage=${perPage}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as OrderPage;
}

export async function getOrder(id: string): Promise<OrderSummary> {
  const response = await fetch(getApiUrl(`/orders/${id}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as OrderSummary;
}

export async function confirmOrderPayment(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/orders/${id}/confirm-payment`), {
    method: 'POST',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function deleteOrder(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/orders/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}
