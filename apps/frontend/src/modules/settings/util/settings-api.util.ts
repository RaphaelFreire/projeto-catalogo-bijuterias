import Cookies from 'js-cookie';

export type StoreSettings = {
  whatsappNumber: string | null;
  logoUrl: string | null;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class SettingsApiError extends Error {
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

async function parseError(response: Response): Promise<SettingsApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new SettingsApiError(response.status, errors);
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const response = await fetch(getApiUrl('/settings'), {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as StoreSettings;
}

export async function updateStoreSettings(whatsappNumber: string): Promise<void> {
  const response = await fetch(getApiUrl('/settings'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ whatsappNumber }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function uploadStoreLogo(file: File): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(getApiUrl('/settings/logo'), {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { logoUrl: string };
}

export async function removeStoreLogo(): Promise<void> {
  const response = await fetch(getApiUrl('/settings/logo'), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}
