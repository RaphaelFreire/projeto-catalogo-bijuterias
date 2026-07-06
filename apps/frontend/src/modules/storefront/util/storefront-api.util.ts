export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  categoryId: string | null;
  quantity: number;
  bestSeller: boolean;
  dailyDeal: boolean;
  lastUnits: boolean;
};

export type StorefrontBanner = {
  id: string;
  imageUrl: string;
  imageUrlMobile: string | null;
  categoryId: string | null;
  linkUrl: string | null;
};

export type StorefrontCategory = {
  id: string;
  name: string;
};

export class StorefrontApiError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export type CheckoutItemIn = {
  productId: string;
  quantity: number;
};

export type CheckoutResult = {
  code: string;
};

export class CheckoutApiError extends Error {
  readonly statusCode: number;
  readonly errors: string[];
  readonly insufficientItems: { productId: string }[];

  constructor(statusCode: number, errors: string[], insufficientItems: { productId: string }[] = []) {
    super(errors[0] ?? 'DEFAULT_API_ERROR');
    this.statusCode = statusCode;
    this.errors = errors.length > 0 ? errors : ['DEFAULT_API_ERROR'];
    this.insufficientItems = insufficientItems;
  }
}

export type StorefrontOrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type StorefrontOrder = {
  code: string;
  customerName: string;
  items: StorefrontOrderItem[];
  total: number;
  createdAt: string;
};

function getApiUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

export async function listActiveProducts(): Promise<StorefrontProduct[]> {
  const response = await fetch(getApiUrl('/storefront/products'), {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new StorefrontApiError('Não foi possível carregar os produtos.');
  }
  return (await response.json()) as StorefrontProduct[];
}

export async function listStorefrontBanners(): Promise<StorefrontBanner[]> {
  const response = await fetch(getApiUrl('/storefront/banners'), {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new StorefrontApiError('Não foi possível carregar os banners.');
  }
  return (await response.json()) as StorefrontBanner[];
}

export async function listStorefrontCategories(): Promise<StorefrontCategory[]> {
  const response = await fetch(getApiUrl('/storefront/categories'), {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new StorefrontApiError('Não foi possível carregar as categorias.');
  }
  return (await response.json()) as StorefrontCategory[];
}

export async function checkout(
  customerName: string,
  items: CheckoutItemIn[],
): Promise<CheckoutResult> {
  const response = await fetch(getApiUrl('/storefront/checkout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName, items }),
  });

  if (!response.ok) {
    let body: {
      errors?: string[];
      details?: { insufficientItems?: { productId: string }[] };
    } | null = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new CheckoutApiError(
      response.status,
      body?.errors ?? [],
      body?.details?.insufficientItems ?? [],
    );
  }

  return (await response.json()) as CheckoutResult;
}

export async function getStorefrontOrderByCode(code: string): Promise<StorefrontOrder> {
  const response = await fetch(getApiUrl(`/storefront/orders/${code}`), {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new StorefrontApiError('Não foi possível carregar o pedido.', response.status);
  }
  return (await response.json()) as StorefrontOrder;
}
