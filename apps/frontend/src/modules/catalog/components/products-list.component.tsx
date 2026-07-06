'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, PackagePlus, Trash2 } from 'lucide-react';
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
  deleteProduct,
  listProducts,
  ProductsApiError,
  type ProductSummary,
} from '../util/products-api.util';

const PER_PAGE = 20;

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function ProductsListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<ProductSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const fetchPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await listProducts(targetPage, PER_PAGE);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error instanceof ProductsApiError) {
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
      await deleteProduct(pendingDelete.id);
      toast.success('Produto excluído com sucesso!');
      setPendingDelete(null);
      const isLastItemOnPage = items.length === 1 && page > 1;
      await fetchPage(isLastItemOnPage ? page - 1 : page);
    } catch (error) {
      if (error instanceof ProductsApiError) {
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
        badge="Produtos"
        title="Cadastro de produtos"
        subtitle="Gerencie os produtos do catálogo."
        aside={
          <Button type="button" onClick={() => router.push('/products/new')}>
            <PackagePlus className="size-4" />
            Novo produto
          </Button>
        }
      />

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyListState
          title="Nenhum produto cadastrado"
          subtitle='Comece criando o primeiro produto pelo botão "Novo produto".'
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {PRICE_FORMATTER.format(product.price)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getMessage(`product.status.${product.status}`)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/products/${product.id}`)}
                        aria-label={`Editar ${product.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(product)}
                        aria-label={`Excluir ${product.name}`}
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
            totalLabel="produtos"
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
        title="Excluir produto"
        description="Esta ação remove o produto selecionado de forma permanente."
        itemLabel="Produto"
        itemValue={pendingDelete?.name ?? ''}
        isConfirming={deleting}
      />
    </div>
  );
}
