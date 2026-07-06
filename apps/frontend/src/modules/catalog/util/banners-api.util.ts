import Cookies from 'js-cookie';

export type BannerSummary = {
  id: string;
  imageUrl: string;
  imageUrlMobile: string | null;
  position: number;
  categoryId: string | null;
  linkUrl: string | null;
};

export type BannerPage = {
  items: BannerSummary[];
  total: number;
  page: number;
  perPage: number;
};

export type SaveBannerPayload = {
  id?: string;
  imageUrl: string;
  imageUrlMobile?: string | null;
  position: number;
  categoryId?: string | null;
  linkUrl?: string | null;
};

export type ApiErrorBody = {
  statusCode: number;
  errors?: string[];
  message?: string;
};

export class BannersApiError extends Error {
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

async function parseError(response: Response): Promise<BannersApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const errors = body && Array.isArray(body.errors) && body.errors.length > 0 ? body.errors : [];
  return new BannersApiError(response.status, errors);
}

export async function listBanners(page: number, perPage: number): Promise<BannerPage> {
  const response = await fetch(getApiUrl(`/banners?page=${page}&perPage=${perPage}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as BannerPage;
}

export async function getBanner(id: string): Promise<BannerSummary> {
  const response = await fetch(getApiUrl(`/banners/${id}`), {
    method: 'GET',
    headers: { ...authHeaders() },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as BannerSummary;
}

export async function createBanner(payload: SaveBannerPayload): Promise<{ id: string }> {
  const response = await fetch(getApiUrl('/banners'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { id: string };
}

export async function updateBanner(id: string, payload: Omit<SaveBannerPayload, 'id'>): Promise<void> {
  const response = await fetch(getApiUrl(`/banners/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function deleteBanner(id: string): Promise<void> {
  const response = await fetch(getApiUrl(`/banners/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function uploadBannerImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(getApiUrl('/banners/upload-image'), {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as { imageUrl: string };
}
