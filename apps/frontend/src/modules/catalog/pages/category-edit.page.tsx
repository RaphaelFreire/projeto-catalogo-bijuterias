'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import CategoryForm from '../components/category-form.component';
import {
  CategoriesApiError,
  getCategory,
  type CategorySummary,
} from '../util/categories-api.util';

type CategoryEditPageProps = {
  id: string;
};

export default function CategoryEditPage({ id }: CategoryEditPageProps) {
  const router = useRouter();
  const [category, setCategory] = useState<CategorySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCategory(id);
        if (!cancelled) setCategory(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof CategoriesApiError) {
          for (const code of error.errors) {
            toast.error(getMessage(code));
          }
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
        router.push('/categories');
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
        badge="Categorias"
        title="Editar categoria"
        subtitle="Atualize os dados da categoria."
      />
      {loading || !category ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <CategoryForm
          mode="edit"
          initialCategory={category}
          onSuccess={() => router.push('/categories')}
          onCancel={() => router.push('/categories')}
        />
      )}
    </div>
  );
}
