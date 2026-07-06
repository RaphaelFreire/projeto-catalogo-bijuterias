'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import { cn } from '@/shared/lib/class-name.util';
import { listAllCategories, type CategorySummary } from '../util/categories-api.util';
import {
  BannersApiError,
  createBanner,
  listBanners,
  updateBanner,
  uploadBannerImage,
  type BannerSummary,
} from '../util/banners-api.util';

type Mode = 'create' | 'edit';

type DestinationType = 'category' | 'link';

type BannerFormProps = {
  mode: Mode;
  initialBanner?: BannerSummary;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function BannerForm({ mode, initialBanner, onSuccess, onCancel }: BannerFormProps) {
  const [destinationType, setDestinationType] = useState<DestinationType>(
    initialBanner?.linkUrl ? 'link' : 'category',
  );
  const [categoryId, setCategoryId] = useState(initialBanner?.categoryId ?? '');
  const [linkUrl, setLinkUrl] = useState(initialBanner?.linkUrl ?? '');
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [imageUrl, setImageUrl] = useState(initialBanner?.imageUrl ?? '');
  const [imageUrlMobile, setImageUrlMobile] = useState(initialBanner?.imageUrlMobile ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageMobile, setUploadingImageMobile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputMobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const items = await listAllCategories();
        if (!cancelled) {
          setCategories(items);
          setCategoryId((current) => current || items[0]?.id || '');
        }
      } catch {
        if (!cancelled) toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    }
    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUploadImage(file: File) {
    setUploadingImage(true);
    try {
      const result = await uploadBannerImage(file);
      setImageUrl(result.imageUrl);
    } catch (error) {
      if (error instanceof BannersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleUploadImageMobile(file: File) {
    setUploadingImageMobile(true);
    try {
      const result = await uploadBannerImage(file);
      setImageUrlMobile(result.imageUrl);
    } catch (error) {
      if (error instanceof BannersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setUploadingImageMobile(false);
      if (fileInputMobileRef.current) fileInputMobileRef.current.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!imageUrl) {
      toast.error(getMessage('banner.imageUrl.required'));
      return;
    }
    if (destinationType === 'category' && !categoryId) {
      toast.error(getMessage('banner.categoryId.required'));
      return;
    }
    if (destinationType === 'link' && !linkUrl) {
      toast.error(getMessage('banner.linkUrl.required'));
      return;
    }

    const destination =
      destinationType === 'category'
        ? { categoryId, linkUrl: null }
        : { categoryId: null, linkUrl };

    setSubmitting(true);
    try {
      if (mode === 'edit' && initialBanner) {
        await updateBanner(initialBanner.id, {
          imageUrl,
          imageUrlMobile: imageUrlMobile || null,
          position: initialBanner.position,
          ...destination,
        });
        toast.success('Banner atualizado com sucesso!');
      } else {
        const existing = await listBanners(1, 10);
        await createBanner({
          imageUrl,
          imageUrlMobile: imageUrlMobile || null,
          position: existing.items.length,
          ...destination,
        });
        toast.success('Banner criado com sucesso!');
      }
      onSuccess();
    } catch (error) {
      if (error instanceof BannersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSectionLayout
        title="Imagem"
        description="Imagem exibida no carrossel da vitrine pública."
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="h-24 w-40 overflow-hidden rounded-md border border-input bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Banner" className="size-full object-cover" />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="size-5" />
              <span className="text-xs">
                {uploadingImage ? 'Enviando...' : imageUrl ? 'Trocar imagem' : 'Adicionar imagem'}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUploadImage(file);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tamanho recomendado: <strong>1400 × 400px</strong> (proporção 7:2) — mesma proporção do
            carrossel na vitrine. A imagem é cortada para preencher o espaço em cada dispositivo, então
            mantenha o conteúdo principal centralizado e evite textos importantes perto das bordas
            esquerda e direita.
          </p>
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Imagem para mobile (opcional)"
        description="Se não for enviada, a imagem para desktop é usada em telas pequenas também."
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {imageUrlMobile ? (
              <div className="h-24 w-16 overflow-hidden rounded-md border border-input bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrlMobile} alt="Banner mobile" className="size-full object-cover" />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => fileInputMobileRef.current?.click()}
              disabled={uploadingImageMobile}
              className="flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="size-5" />
              <span className="text-xs">
                {uploadingImageMobile
                  ? 'Enviando...'
                  : imageUrlMobile
                    ? 'Trocar imagem'
                    : 'Adicionar imagem'}
              </span>
            </button>
            {imageUrlMobile ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrlMobile('')}>
                Remover
              </Button>
            ) : null}
            <input
              ref={fileInputMobileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUploadImageMobile(file);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tamanho recomendado: <strong>900 × 600px</strong> (proporção 3:2) — mesma proporção usada no
            carrossel em telas pequenas.
          </p>
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Destino"
        description="Para onde o clique no banner leva o visitante: uma categoria do catálogo ou um link externo."
        showDivider={false}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="destinationType"
                checked={destinationType === 'category'}
                onChange={() => setDestinationType('category')}
              />
              Categoria
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="destinationType"
                checked={destinationType === 'link'}
                onChange={() => setDestinationType('link')}
              />
              Link (URL)
            </label>
          </div>

          {destinationType === 'category' ? (
            <div>
              <Label htmlFor="banner-form-category">Categoria</Label>
              <select
                id="banner-form-category"
                name="categoryId"
                required
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {categories.length === 0 ? (
                  <option value="">Nenhuma categoria cadastrada</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="banner-form-link">Link</Label>
              <Input
                id="banner-form-link"
                name="linkUrl"
                type="url"
                required
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://wa.me/5511999998888"
              />
            </div>
          )}
        </div>
      </FormSectionLayout>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting || (destinationType === 'category' && categories.length === 0)}
        >
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
