'use client';

import { useRouter } from 'next/navigation';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import BannerForm from '../components/banner-form.component';

export default function BannerCreatePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Banners"
        title="Novo banner"
        subtitle="Cadastre um novo banner para a vitrine pública."
      />
      <BannerForm
        mode="create"
        onSuccess={() => router.push('/banners')}
        onCancel={() => router.push('/banners')}
      />
    </div>
  );
}
