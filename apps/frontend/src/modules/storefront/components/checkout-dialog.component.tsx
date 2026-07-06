'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import { getStoreSettings } from '@/modules/settings/util/settings-api.util';
import { useCart } from '../context/cart.context';
import { buildWhatsappLink, buildWhatsappMessage } from '../util/whatsapp-message.util';
import { checkout, CheckoutApiError } from '../util/storefront-api.util';

type CheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const cart = useCart();
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (customerName.trim() === '') {
      toast.error(getMessage('storefront.customerName.required'));
      return;
    }

    setSubmitting(true);
    try {
      const settings = await getStoreSettings();
      if (!settings.whatsappNumber) {
        toast.error(getMessage('storefront.whatsappNumber.not_configured'));
        return;
      }

      const trimmedName = customerName.trim();
      const result = await checkout(
        trimmedName,
        cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      );

      const orderLink = `${window.location.origin}/pedido/${result.code}`;
      const message = buildWhatsappMessage(trimmedName, cart.items, cart.totalPrice, {
        code: result.code,
        link: orderLink,
      });
      const link = buildWhatsappLink(settings.whatsappNumber, message);

      window.open(link, '_blank', 'noopener,noreferrer');
      cart.clear();
      onOpenChange(false);
      setCustomerName('');
    } catch (error) {
      if (error instanceof CheckoutApiError) {
        if (error.insufficientItems.length > 0) {
          const names = error.insufficientItems
            .map((item) => cart.items.find((cartItem) => cartItem.productId === item.productId)?.name)
            .filter((name): name is string => Boolean(name));
          toast.error(
            `${getMessage('order.stock.insufficient')}${names.length > 0 ? `: ${names.join(', ')}` : ''}`,
          );
        } else {
          for (const code of error.errors) {
            toast.error(getMessage(code));
          }
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Informe seu nome para enviarmos o pedido pelo WhatsApp.
          </p>
          <div>
            <Label htmlFor="checkout-customer-name">Seu nome</Label>
            <Input
              id="checkout-customer-name"
              name="customerName"
              type="text"
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Maria Silva"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? 'Enviando...' : 'Enviar pedido pelo WhatsApp'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
