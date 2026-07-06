'use client';

import { useState } from 'react';
import { ImageOff, Images, Maximize2, ShoppingCart } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/class-name.util';
import type { StorefrontProduct } from '../util/storefront-api.util';
import { ProductImageViewer } from './product-image-viewer.component';

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type ProductCardProps = {
  product: StorefrontProduct;
  cartQuantity: number;
  onAddToCart: () => void;
};

type BadgeInfo = { label: string; className: string };

/** Só um selo por vez, na ordem de prioridade abaixo — evita empilhar vários badges sobre a miniatura. */
function getPrimaryBadge(product: StorefrontProduct, outOfStock: boolean): BadgeInfo | null {
  if (outOfStock) {
    return { label: 'Esgotado', className: 'bg-secondary text-secondary-foreground' };
  }
  if (product.dailyDeal) {
    return { label: 'Oferta do dia', className: 'bg-red-500/15 text-red-600 dark:text-red-400' };
  }
  if (product.lastUnits) {
    return { label: 'Últimas unidades', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
  }
  if (product.bestSeller) {
    return { label: 'Mais vendido', className: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' };
  }
  return null;
}

export function ProductCard({ product, cartQuantity, onAddToCart }: ProductCardProps) {
  const [imageOpen, setImageOpen] = useState(false);
  const outOfStock = product.quantity <= 0;
  const atCartLimit = !outOfStock && cartQuantity >= product.quantity;
  const coverImage = product.images[0];
  const primaryBadge = getPrimaryBadge(product, outOfStock);

  return (
    <Card className="flex flex-row gap-4 rounded-2xl p-4 sm:flex-col sm:gap-3">
      <div className="relative h-32.5 w-32 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-auto sm:w-full sm:aspect-square">
        {coverImage ? (
          <button
            type="button"
            onClick={() => setImageOpen(true)}
            className="group relative size-full cursor-zoom-in"
            aria-label={`Ampliar imagem de ${product.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt={product.name} className="size-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
              <Maximize2 className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
        {product.images.length > 1 ? (
          <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
            <Images className="size-3" />
            {product.images.length}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 sm:justify-start">
        <Badge
          className={cn(
            'w-fit whitespace-nowrap border-transparent px-2 py-0.5 text-[10px] font-medium normal-case sm:text-xs',
            primaryBadge ? primaryBadge.className : 'invisible',
          )}
        >
          {primaryBadge?.label ?? 'Selo'}
        </Badge>

        <h3 className="line-clamp-2 min-h-9 text-sm font-normal leading-tight text-foreground sm:min-h-11 sm:text-lg">
          {product.name}
        </h3>

        <span className="text-base font-bold leading-none text-foreground sm:text-xl">
          {PRICE_FORMATTER.format(product.price)}
        </span>

        <Button
          type="button"
          size="sm"
          className="mt-1.5 w-full rounded-lg border border-emerald-600/40 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20"
          onClick={onAddToCart}
          disabled={outOfStock || atCartLimit}
        >
          <ShoppingCart className="size-4" />
          {atCartLimit ? 'Limite em estoque' : 'Adicionar'}
        </Button>
      </div>

      {coverImage ? (
        <ProductImageViewer
          open={imageOpen}
          onOpenChange={setImageOpen}
          images={product.images}
          initialIndex={0}
          imageAlt={product.name}
        />
      ) : null}
    </Card>
  );
}
