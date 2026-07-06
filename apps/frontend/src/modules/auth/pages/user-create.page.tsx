'use client';

import { useRouter } from 'next/navigation';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import UserForm from '../components/user-form.component';

export default function UserCreatePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Usuários"
        title="Novo usuário"
        subtitle="Cadastre um novo usuário com acesso ao sistema."
      />
      <UserForm
        mode="create"
        onSuccess={() => router.push('/users')}
        onCancel={() => router.push('/users')}
      />
    </div>
  );
}
