'use client';

import { useState } from 'react';
import { ImageOff, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { useCart } from '../context/cart.context';
import { CheckoutDialog } from './checkout-dialog.component';

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function CartSheet() {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="secondary" className="relative">
            <ShoppingCart className="size-4" />
            Carrinho
            {cart.totalItems > 0 ? (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {cart.totalItems}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>

        <SheetContent className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>Seu carrinho</SheetTitle>
          </SheetHeader>

          {cart.items.length === 0 ? (
            <EmptyListState title="Carrinho vazio" subtitle="Adicione produtos para continuar." />
          ) : (
            <div className="thin-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-3 -mr-3">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex gap-2.5 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug">{item.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => cart.removeItem(item.productId)}
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {PRICE_FORMATTER.format(item.price)}
                      </span>
                      <div className="flex items-center gap-1 rounded-md border border-input">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-4 text-center text-sm tabular-nums">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => {
                            const updated = cart.updateQuantity(item.productId, item.quantity + 1);
                            if (!updated) {
                              toast.error(`Estoque insuficiente para ${item.name}.`);
                            }
                          }}
                          disabled={item.quantity >= item.availableQuantity}
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{PRICE_FORMATTER.format(cart.totalPrice)}</span>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={cart.items.length === 0}
              onClick={() => {
                setOpen(false);
                setCheckoutOpen(true);
              }}
            >
              Finalizar pedido
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
