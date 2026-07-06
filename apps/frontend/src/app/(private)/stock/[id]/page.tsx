import StockEditPage from '@/modules/catalog/pages/stock-edit.page';

export default async function StockEditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StockEditPage id={id} />;
}
