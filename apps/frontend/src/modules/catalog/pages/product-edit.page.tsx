'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import ProductForm from '../components/product-form.component';
import {
  getProduct,
  ProductsApiError,
  type ProductSummary,
} from '../util/products-api.util';

type ProductEditPageProps = {
  id: string;
};

export default function ProductEditPage({ id }: ProductEditPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getProduct(id);
        if (!cancelled) setProduct(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ProductsApiError) {
          for (const code of error.errors) {
            toast.error(getMessage(code));
          }
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
        router.push('/products');
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
        badge="Produtos"
        title="Editar produto"
        subtitle="Atualize os dados do produto."
      />
      {loading || !product ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <ProductForm
          mode="edit"
          initialProduct={product}
          onSuccess={() => router.push('/products')}
          onCancel={() => router.push('/products')}
        />
      )}
    </div>
  );
}
