import ProductEditPage from '@/modules/catalog/pages/product-edit.page';

export default async function ProductEditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductEditPage id={id} />;
}
