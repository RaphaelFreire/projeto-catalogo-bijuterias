import Cookies from 'js-cookie';

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export type UserPage = {
  items: UserSummary[];
  total: number;
  page: number;
  perPage: number;
};

export type SaveUserPayload = {
  id?: string;
  name: string;
  email: string;
  password?: string;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class UsersApiError extends Error {
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

async function parseError(response: Response): Promise<UsersApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new UsersApiError(response.status, errors);
}

export async function listUsers(page: number, perPage: number): Promise<UserPage> {
  const response = await fetch(getApiUrl(`/users?page=${page}&perPage=${perPage}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as UserPage;
}

export async function getUser(id: string): Promise<UserSummary> {
  const response = await fetch(getApiUrl(`/users/${id}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as UserSummary;
}

export async function createUser(payload: SaveUserPayload): Promise<void> {
  const response = await fetch(getApiUrl('/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function updateUser(id: string, payload: Omit<SaveUserPayload, 'id'>): Promise<void> {
  const response = await fetch(getApiUrl(`/users/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/users/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}
