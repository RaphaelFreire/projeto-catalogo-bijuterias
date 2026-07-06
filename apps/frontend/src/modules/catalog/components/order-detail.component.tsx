'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
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
  confirmOrderPayment,
  deleteOrder,
  getOrder,
  OrdersApiError,
  type OrderSummary,
} from '../util/orders-api.util';

type OrderDetailProps = {
  id: string;
};

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export default function OrderDetail({ id }: OrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadOrder() {
    try {
      const data = await getOrder(id);
      setOrder(data);
      return true;
    } catch (error) {
      if (error instanceof OrdersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
      router.push('/orders');
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const ok = await loadOrder();
      if (cancelled) return;
      if (!ok) return;
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirmPayment() {
    if (!order) return;
    setConfirmingPayment(true);
    try {
      await confirmOrderPayment(order.id);
      toast.success('Pagamento confirmado com sucesso!');
      await loadOrder();
    } catch (error) {
      if (error instanceof OrdersApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setConfirmingPayment(false);
    }
  }

  async function handleConfirmDelete() {
    if (!order) return;
    setDeleting(true);
    try {
      await deleteOrder(order.id);
      toast.success('Pedido excluído com sucesso!');
      router.push('/orders');
    } catch (error) {
      if (error instanceof OrdersApiError) {
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

  const backButton = (
    <Button type="button" variant="secondary" onClick={() => router.push('/orders')}>
      <ArrowLeft className="size-4" />
      Todos os pedidos
    </Button>
  );

  if (loading || !order) {
    return (
      <div className="space-y-6">
        <PageSectionHeader
          badge="Pedidos"
          title="Detalhe do pedido"
          subtitle="Carregando..."
          aside={backButton}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Pedidos"
        title={`Pedido ${order.code}`}
        subtitle={`${order.customerName} · ${DATE_FORMATTER.format(new Date(order.createdAt))}`}
        aside={backButton}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant={order.paymentConfirmed ? 'default' : 'secondary'}>
          {order.paymentConfirmed ? 'Pagamento confirmado' : 'Pagamento pendente'}
        </Badge>

        <div className="flex items-center gap-2">
          {!order.paymentConfirmed ? (
            <Button
              type="button"
              onClick={() => void handleConfirmPayment()}
              disabled={confirmingPayment}
              className="rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20"
            >
              <CheckCircle2 className="size-4" />
              {confirmingPayment ? 'Confirmando...' : 'Confirmar pagamento'}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="size-4" />
            Excluir pedido
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item, index) => (
            <TableRow key={`${item.productId}-${index}`}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {PRICE_FORMATTER.format(item.price)}
              </TableCell>
              <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
              <TableCell className="text-right">
                {PRICE_FORMATTER.format(item.price * item.quantity)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <p className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">{PRICE_FORMATTER.format(order.total)}</span>
        </p>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => void handleConfirmDelete()}
        title="Excluir pedido"
        description="Esta ação remove o pedido selecionado de forma permanente. O estoque descontado no checkout NÃO é devolvido."
        itemLabel="Pedido"
        itemValue={order.code}
        isConfirming={deleting}
      />
    </div>
  );
}
