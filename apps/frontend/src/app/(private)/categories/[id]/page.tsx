import CategoryEditPage from '@/modules/catalog/pages/category-edit.page';

export default async function CategoryEditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryEditPage id={id} />;
}
