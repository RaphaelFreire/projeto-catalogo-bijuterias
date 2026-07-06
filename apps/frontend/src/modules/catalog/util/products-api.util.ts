import Cookies from 'js-cookie';

export type ProductStatus = 'active' | 'inactive' | 'draft';

export const PRODUCT_STATUSES: readonly ProductStatus[] = ['active', 'inactive', 'draft'];

export type ProductSummary = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  bestSeller: boolean;
  dailyDeal: boolean;
  lastUnits: boolean;
  categoryId: string | null;
  images: string[];
  quantity: number;
};

export type ProductPage = {
  items: ProductSummary[];
  total: number;
  page: number;
  perPage: number;
};

export type SaveProductPayload = {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  status: ProductStatus;
  bestSeller?: boolean;
  dailyDeal?: boolean;
  lastUnits?: boolean;
  categoryId?: string | null;
  images?: string[];
  quantity?: number;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class ProductsApiError extends Error {
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

async function parseError(response: Response): Promise<ProductsApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new ProductsApiError(response.status, errors);
}

export async function listProducts(page: number, perPage: number): Promise<ProductPage> {
  const response = await fetch(getApiUrl(`/products?page=${page}&perPage=${perPage}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as ProductPage;
}

export async function getProduct(id: string): Promise<ProductSummary> {
  const response = await fetch(getApiUrl(`/products/${id}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as ProductSummary;
}

export async function createProduct(payload: SaveProductPayload): Promise<{ id: string }> {
  const response = await fetch(getApiUrl('/products'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { id: string };
}

export async function updateProduct(id: string, payload: Omit<SaveProductPayload, 'id'>): Promise<void> {
  const response = await fetch(getApiUrl(`/products/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/products/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function uploadProductImage(id: string, file: File): Promise<{ images: string[] }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(getApiUrl(`/products/${id}/images`), {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { images: string[] };
}

export async function removeProductImage(id: string, url: string): Promise<void> {
  const response = await fetch(getApiUrl(`/products/${id}/images`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}
