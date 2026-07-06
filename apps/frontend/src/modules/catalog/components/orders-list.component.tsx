'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
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
import { listOrders, OrdersApiError, type OrderSummary } from '../util/orders-api.util';

const PER_PAGE = 20;

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export default function OrdersListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<OrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const fetchPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await listOrders(targetPage, PER_PAGE);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error instanceof OrdersApiError) {
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

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Pedidos"
        title="Pedidos da vitrine"
        subtitle="Pedidos feitos pelos clientes através do checkout da vitrine pública."
      />

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyListState
          title="Nenhum pedido ainda"
          subtitle="Pedidos aparecem aqui assim que um cliente finalizar uma compra na vitrine."
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.code}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {PRICE_FORMATTER.format(order.total)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {DATE_FORMATTER.format(new Date(order.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/orders/${order.id}`)}
                      aria-label={`Ver pedido ${order.code}`}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={total}
            totalLabel="pedidos"
            onPageChange={(nextPage) => void fetchPage(nextPage)}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}
