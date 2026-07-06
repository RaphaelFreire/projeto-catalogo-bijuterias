'use client';

import { useRouter } from 'next/navigation';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import CategoryForm from '../components/category-form.component';

export default function CategoryCreatePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Categorias"
        title="Nova categoria"
        subtitle="Cadastre uma nova categoria no catálogo."
      />
      <CategoryForm
        mode="create"
        onSuccess={() => router.push('/categories')}
        onCancel={() => router.push('/categories')}
      />
    </div>
  );
}
