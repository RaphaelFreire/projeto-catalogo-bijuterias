import BannerEditPage from '@/modules/catalog/pages/banner-edit.page';

export default async function BannerEditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BannerEditPage id={id} />;
}
