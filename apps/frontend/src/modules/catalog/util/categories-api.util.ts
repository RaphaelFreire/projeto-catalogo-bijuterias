import Cookies from 'js-cookie';

export type CategorySummary = {
  id: string;
  name: string;
};

export type CategoryPage = {
  items: CategorySummary[];
  total: number;
  page: number;
  perPage: number;
};

export type SaveCategoryPayload = {
  id?: string;
  name: string;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class CategoriesApiError extends Error {
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

async function parseError(response: Response): Promise<CategoriesApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new CategoriesApiError(response.status, errors);
}

export async function listCategories(page: number, perPage: number): Promise<CategoryPage> {
  const response = await fetch(getApiUrl(`/categories?page=${page}&perPage=${perPage}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as CategoryPage;
}

export async function getCategory(id: string): Promise<CategorySummary> {
  const response = await fetch(getApiUrl(`/categories/${id}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as CategorySummary;
}

export async function createCategory(payload: SaveCategoryPayload): Promise<void> {
  const response = await fetch(getApiUrl('/categories'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function updateCategory(id: string, payload: Omit<SaveCategoryPayload, 'id'>): Promise<void> {
  const response = await fetch(getApiUrl(`/categories/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/categories/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

/** Lista todas as categorias (sem paginação visível) para popular selects. */
export async function listAllCategories(): Promise<CategorySummary[]> {
  const data = await listCategories(1, 200);
  return data.items;
}
