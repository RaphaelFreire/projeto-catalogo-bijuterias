import Cookies from 'js-cookie';

export type PeriodGranularity = 'day' | 'week' | 'month';

export type StockSummary = {
  totalQuantity: number;
};

export type OrderSummary = {
  totalOrders: number;
  totalRevenue: number;
};

export type DashboardSummary = {
  stock: StockSummary;
  orders: OrderSummary;
};

export type CriticalStockItem = {
  productId: string;
  productName: string | null;
  quantity: number;
};

export type OrdersByPeriodPoint = {
  periodStart: string;
  orderCount: number;
  revenue: number;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class DashboardApiError extends Error {
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

async function parseError(response: Response): Promise<DashboardApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new DashboardApiError(response.status, errors);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(getApiUrl('/dashboard/summary'), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as DashboardSummary;
}

export async function listCriticalStock(limit = 5): Promise<CriticalStockItem[]> {
  const response = await fetch(getApiUrl(`/dashboard/critical-stock?limit=${limit}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as CriticalStockItem[];
}

export async function listOrdersByPeriod(
  granularity: PeriodGranularity,
): Promise<OrdersByPeriodPoint[]> {
  const response = await fetch(
    getApiUrl(`/dashboard/orders-by-period?granularity=${granularity}`),
    {
      method: 'GET',
      headers: { ...authHeaders() },
      cache: 'no-store',
    },
  );
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as OrdersByPeriodPoint[];
}
