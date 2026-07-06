'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import UserForm from '../components/user-form.component';
import { getUser, UsersApiError, type UserSummary } from '../util/users-api.util';

type UserEditPageProps = {
  id: string;
};

export default function UserEditPage({ id }: UserEditPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getUser(id);
        if (!cancelled) setUser(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof UsersApiError) {
          for (const code of error.errors) {
            toast.error(getMessage(code));
          }
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
        router.push('/users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Usuários"
        title="Editar usuário"
        subtitle="Atualize os dados do usuário. Deixe a senha em branco para mantê-la."
      />
      {loading || !user ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <UserForm
          mode="edit"
          initialUser={user}
          onSuccess={() => router.push('/users')}
          onCancel={() => router.push('/users')}
        />
      )}
    </div>
  );
}
