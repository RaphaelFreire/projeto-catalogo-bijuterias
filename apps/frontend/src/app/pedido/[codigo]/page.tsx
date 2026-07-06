import OrderLookupPage from '@/modules/storefront/pages/order-lookup.page';

export default async function PedidoRoutePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return <OrderLookupPage code={codigo} />;
}
