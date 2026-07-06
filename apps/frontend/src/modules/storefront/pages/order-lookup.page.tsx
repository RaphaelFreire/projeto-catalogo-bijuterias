'use client';

import { useEffect, useState } from 'react';
import { PackageSearch, Store } from 'lucide-react';
import {
  getStorefrontOrderByCode,
  type StorefrontOrder,
} from '../util/storefront-api.util';

type OrderLookupPageProps = {
  code: string;
};

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export default function OrderLookupPage({ code }: OrderLookupPageProps) {
  const [order, setOrder] = useState<StorefrontOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getStorefrontOrderByCode(code);
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <Store className="size-6 text-primary" />
          <span className="text-lg font-bold">Loja</span>
        </div>
      </header>

      <main className="mx-auto max-w-screen-sm px-4 py-10 sm:px-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : notFound || !order ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <PackageSearch className="size-10 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Pedido não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              Confira se o código do pedido está correto.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Pedido {order.code}</h1>
              <p className="text-sm text-muted-foreground">
                {order.customerName} · {DATE_FORMATTER.format(new Date(order.createdAt))}
              </p>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border">
              {order.items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x {PRICE_FORMATTER.format(item.price)}
                    </p>
                  </div>
                  <p className="font-medium">{PRICE_FORMATTER.format(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <p className="text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="text-lg font-semibold">{PRICE_FORMATTER.format(order.total)}</span>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
