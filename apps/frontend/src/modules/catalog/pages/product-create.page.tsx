'use client';

import { useRouter } from 'next/navigation';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import ProductForm from '../components/product-form.component';

export default function ProductCreatePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Produtos"
        title="Novo produto"
        subtitle="Cadastre um novo produto no catálogo."
      />
      <ProductForm
        mode="create"
        onSuccess={() => router.push('/products')}
        onCancel={() => router.push('/products')}
      />
    </div>
  );
}
