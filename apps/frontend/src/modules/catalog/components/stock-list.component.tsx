'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
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
  deleteStock,
  listStock,
  StockApiError,
  type StockSummary,
} from '../util/stock-api.util';

const PER_PAGE = 20;

export default function StockListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<StockSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<StockSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const fetchPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await listStock(targetPage, PER_PAGE);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error instanceof StockApiError) {
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
      await deleteStock(pendingDelete.id);
      toast.success('Estoque excluído com sucesso!');
      setPendingDelete(null);
      const isLastItemOnPage = items.length === 1 && page > 1;
      await fetchPage(isLastItemOnPage ? page - 1 : page);
    } catch (error) {
      if (error instanceof StockApiError) {
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
        badge="Estoque"
        title="Controle de estoque"
        subtitle="Gerencie a quantidade em estoque de cada produto."
      />

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyListState
          title="Nenhum estoque cadastrado"
          subtitle="O estoque de um produto é criado automaticamente ao cadastrar o produto."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    {stock.productName ?? 'Produto removido'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{stock.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/stock/${stock.id}`)}
                        aria-label={`Editar estoque de ${stock.productName ?? stock.productId}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(stock)}
                        aria-label={`Excluir estoque de ${stock.productName ?? stock.productId}`}
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
            totalLabel="registros de estoque"
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
        title="Excluir estoque"
        description="Esta ação remove o registro de estoque selecionado de forma permanente."
        itemLabel="Produto"
        itemValue={pendingDelete?.productName ?? ''}
        isConfirming={deleting}
      />
    </div>
  );
}
