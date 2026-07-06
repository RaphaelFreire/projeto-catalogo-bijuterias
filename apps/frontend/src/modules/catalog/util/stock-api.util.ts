import Cookies from 'js-cookie';

export type StockSummary = {
  id: string;
  productId: string;
  productName: string | null;
  quantity: number;
};

export type StockPage = {
  items: StockSummary[];
  total: number;
  page: number;
  perPage: number;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class StockApiError extends Error {
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

async function parseError(response: Response): Promise<StockApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new StockApiError(response.status, errors);
}

export async function listStock(page: number, perPage: number): Promise<StockPage> {
  const response = await fetch(getApiUrl(`/stock?page=${page}&perPage=${perPage}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as StockPage;
}

export async function getStock(id: string): Promise<StockSummary> {
  const response = await fetch(getApiUrl(`/stock/${id}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as StockSummary;
}

export async function updateStock(id: string, quantity: number): Promise<void> {
  const response = await fetch(getApiUrl(`/stock/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function deleteStock(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/stock/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}
