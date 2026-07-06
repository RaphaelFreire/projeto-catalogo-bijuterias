'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import StockForm from '../components/stock-form.component';
import {
  getStock,
  StockApiError,
  type StockSummary,
} from '../util/stock-api.util';

type StockEditPageProps = {
  id: string;
};

export default function StockEditPage({ id }: StockEditPageProps) {
  const router = useRouter();
  const [stock, setStock] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getStock(id);
        if (!cancelled) setStock(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof StockApiError) {
          for (const code of error.errors) {
            toast.error(getMessage(code));
          }
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
        router.push('/stock');
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
        badge="Estoque"
        title="Editar estoque"
        subtitle="Atualize a quantidade em estoque do produto."
      />
      {loading || !stock ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <StockForm
          initialStock={stock}
          onSuccess={() => router.push('/stock')}
          onCancel={() => router.push('/stock')}
        />
      )}
    </div>
  );
}
