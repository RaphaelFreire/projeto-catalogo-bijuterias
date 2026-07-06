'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { getMessage } from '@/shared/i18n';
import {
  BannersApiError,
  deleteBanner,
  listBanners,
  updateBanner,
  type BannerSummary,
} from '../util/banners-api.util';

const MAX_BANNERS = 3;

export default function BannersListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<BannerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<BannerSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBanners(1, MAX_BANNERS + 1);
      setItems(data.items);
    } catch (error) {
      if (error instanceof BannersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteBanner(pendingDelete.id);
      toast.success('Banner excluído com sucesso!');
      setPendingDelete(null);
      await fetchAll();
    } catch (error) {
      if (error instanceof BannersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setReordering(true);
    try {
      const current = items[index];
      const target = items[targetIndex];
      await Promise.all([
        updateBanner(current.id, {
          imageUrl: current.imageUrl,
          imageUrlMobile: current.imageUrlMobile,
          position: target.position,
          categoryId: current.categoryId,
          linkUrl: current.linkUrl,
        }),
        updateBanner(target.id, {
          imageUrl: target.imageUrl,
          imageUrlMobile: target.imageUrlMobile,
          position: current.position,
          categoryId: target.categoryId,
          linkUrl: target.linkUrl,
        }),
      ]);
      await fetchAll();
    } catch (error) {
      if (error instanceof BannersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setReordering(false);
    }
  }

  const atLimit = items.length >= MAX_BANNERS;

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Banners"
        title="Banners da vitrine"
        subtitle={`Até ${MAX_BANNERS} banners, exibidos em destaque na vitrine pública.`}
        aside={
          <Button
            type="button"
            onClick={() => router.push('/banners/new')}
            disabled={atLimit}
            title={atLimit ? `Limite de ${MAX_BANNERS} banners atingido` : undefined}
          >
            <ImageIcon className="size-4" />
            Novo banner
          </Button>
        }
      />

      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          Limite de {MAX_BANNERS} banners atingido. Exclua um banner existente para adicionar outro.
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyListState
          title="Nenhum banner cadastrado"
          subtitle='Comece criando o primeiro banner pelo botão "Novo banner".'
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Posição</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((banner, index) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <div className="size-14 overflow-hidden rounded-md border border-input bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.imageUrl} alt="Banner" className="size-full object-cover" />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{banner.position}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleMove(index, -1)}
                      disabled={index === 0 || reordering}
                      aria-label="Subir"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleMove(index, 1)}
                      disabled={index === items.length - 1 || reordering}
                      aria-label="Descer"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/banners/${banner.id}`)}
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDelete(banner)}
                      aria-label="Excluir"
                    >
                      <Trash2 className="size-4 text-red-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DeleteConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Excluir banner"
        description="Esta ação remove o banner selecionado de forma permanente."
        itemLabel="Banner"
        itemValue={pendingDelete ? `Posição ${pendingDelete.position}` : ''}
        isConfirming={deleting}
      />
    </div>
  );
}
