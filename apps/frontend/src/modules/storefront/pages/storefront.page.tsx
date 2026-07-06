'use client';

import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';
import { getStoreSettings } from '@/modules/settings/util/settings-api.util';
import { CartProvider } from '../context/cart.context';
import { CartSheet } from '../components/cart-sheet.component';
import { BannerCarousel } from '../components/banner-carousel.component';
import { ProductGrid } from '../components/product-grid.component';

export default function StorefrontPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      try {
        const settings = await getStoreSettings();
        if (!cancelled) setLogoUrl(settings.logoUrl);
      } catch {
        // Silencioso: sem logo configurada (ou erro ao buscar), usa o fallback.
      }
    }
    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo da loja" className="h-8 w-auto object-contain" />
            ) : (
              <>
                <Store className="size-6 text-primary" />
                <span className="text-lg font-bold">Loja</span>
              </>
            )}
          </div>
          <CartSheet />
        </header>

        <main className="mx-auto max-w-screen-2xl space-y-4 px-4 py-6 sm:px-8">
          <BannerCarousel />
          <ProductGrid />
        </main>
      </div>
    </CartProvider>
  );
}
