'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import {
  getStoreSettings,
  removeStoreLogo,
  SettingsApiError,
  updateStoreSettings,
  uploadStoreLogo,
} from '../util/settings-api.util';

export default function SettingsComponent() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const settings = await getStoreSettings();
        if (!cancelled) {
          setWhatsappNumber(settings.whatsappNumber ?? '');
          setLogoUrl(settings.logoUrl);
        }
      } catch {
        if (!cancelled) toast.error(getMessage('DEFAULT_API_ERROR'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    try {
      await updateStoreSettings(whatsappNumber);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      if (error instanceof SettingsApiError) {
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

  async function handleUploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const result = await uploadStoreLogo(file);
      setLogoUrl(result.logoUrl);
      toast.success('Logo atualizada com sucesso!');
    } catch (error) {
      if (error instanceof SettingsApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveLogo() {
    try {
      await removeStoreLogo();
      setLogoUrl(null);
      toast.success('Logo removida com sucesso!');
    } catch (error) {
      if (error instanceof SettingsApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    }
  }

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Configurações"
        title="Configurações da loja"
        subtitle="Defina o número de WhatsApp e a logo usados na vitrine pública."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSectionLayout
            title="WhatsApp"
            description="Número que recebe os pedidos feitos pela vitrine pública."
          >
            <div>
              <Label htmlFor="settings-whatsapp-number">Número de WhatsApp</Label>
              <Input
                id="settings-whatsapp-number"
                name="whatsappNumber"
                type="text"
                required
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="+5511999998888"
              />
            </div>
          </FormSectionLayout>

          <FormSectionLayout
            title="Logo"
            description="Exibida no cabeçalho da vitrine pública."
            showDivider={false}
          >
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative size-20 overflow-hidden rounded-md border border-input">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo da loja" className="size-full object-contain" />
                  <button
                    type="button"
                    onClick={() => void handleRemoveLogo()}
                    aria-label="Remover logo"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ImagePlus className="size-5" />
                  <span className="text-xs">{uploadingLogo ? 'Enviando...' : 'Adicionar'}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUploadLogo(file);
                }}
              />
            </div>
          </FormSectionLayout>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
