import UserEditPage from '@/modules/auth/pages/user-edit.page';

export default async function UserEditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserEditPage id={id} />;
}
