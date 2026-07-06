import type { CartItem } from '../context/cart.context';

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function buildWhatsappMessage(
  customerName: string,
  items: CartItem[],
  total: number,
  order?: { code: string; link: string },
): string {
  const lines = items.map(
    (item) => `${item.quantity}x ${item.name} — ${PRICE_FORMATTER.format(item.price * item.quantity)}`,
  );

  return [
    `Pedido de ${customerName}:`,
    '',
    ...lines,
    '',
    `Total: ${PRICE_FORMATTER.format(total)}`,
    ...(order ? ['', `Código do pedido: ${order.code}`, `Acompanhe em: ${order.link}`] : []),
  ].join('\n');
}

export function buildWhatsappLink(whatsappNumber: string, message: string): string {
  const digitsOnly = whatsappNumber.replace('+', '');
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
