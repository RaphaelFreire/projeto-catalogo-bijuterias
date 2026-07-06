'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
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
  CategoriesApiError,
  deleteCategory,
  listCategories,
  type CategorySummary,
} from '../util/categories-api.util';

const PER_PAGE = 20;

export default function CategoriesListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<CategorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<CategorySummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const fetchPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await listCategories(targetPage, PER_PAGE);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error instanceof CategoriesApiError) {
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
    void fetchPage(1);
  }, [fetchPage]);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(pendingDelete.id);
      toast.success('Categoria excluída com sucesso!');
      setPendingDelete(null);
      const isLastItemOnPage = items.length === 1 && page > 1;
      await fetchPage(isLastItemOnPage ? page - 1 : page);
    } catch (error) {
      if (error instanceof CategoriesApiError) {
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

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Categorias"
        title="Cadastro de categorias"
        subtitle="Gerencie as categorias do catálogo."
        aside={
          <Button type="button" onClick={() => router.push('/categories/new')}>
            <Tag className="size-4" />
            Nova categoria
          </Button>
        }
      />

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyListState
          title="Nenhuma categoria cadastrada"
          subtitle='Comece criando a primeira categoria pelo botão "Nova categoria".'
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/categories/${category.id}`)}
                        aria-label={`Editar ${category.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(category)}
                        aria-label={`Excluir ${category.name}`}
                      >
                        <Trash2 className="size-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={total}
            totalLabel="categorias"
            onPageChange={(nextPage) => void fetchPage(nextPage)}
            disabled={loading}
          />
        </>
      )}

      <DeleteConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
        title="Excluir categoria"
        description="Esta ação remove a categoria selecionada de forma permanente."
        itemLabel="Categoria"
        itemValue={pendingDelete?.name ?? ''}
        isConfirming={deleting}
      />
    </div>
  );
}
