'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import BannerForm from '../components/banner-form.component';
import {
  BannersApiError,
  getBanner,
  type BannerSummary,
} from '../util/banners-api.util';

type BannerEditPageProps = {
  id: string;
};

export default function BannerEditPage({ id }: BannerEditPageProps) {
  const router = useRouter();
  const [banner, setBanner] = useState<BannerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getBanner(id);
        if (!cancelled) setBanner(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof BannersApiError) {
          for (const code of error.errors) {
            toast.error(getMessage(code));
          }
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
        router.push('/banners');
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
        badge="Banners"
        title="Editar banner"
        subtitle="Atualize a imagem ou a categoria de destino do banner."
      />
      {loading || !banner ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <BannerForm
          mode="edit"
          initialBanner={banner}
          onSuccess={() => router.push('/banners')}
          onCancel={() => router.push('/banners')}
        />
      )}
    </div>
  );
}
