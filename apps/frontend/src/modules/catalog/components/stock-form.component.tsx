'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import { StockApiError, type StockSummary, updateStock } from '../util/stock-api.util';

type StockFormProps = {
  initialStock: StockSummary;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function StockForm({ initialStock, onSuccess, onCancel }: StockFormProps) {
  const [quantity, setQuantity] = useState<string>(String(initialStock.quantity));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity)) {
      toast.error(getMessage('stock.quantity.required'));
      return;
    }

    setSubmitting(true);
    try {
      await updateStock(initialStock.id, parsedQuantity);
      toast.success('Estoque atualizado com sucesso!');
      onSuccess();
    } catch (error) {
      if (error instanceof StockApiError) {
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
        title="Produto e quantidade"
        description="Atualize a quantidade em estoque do produto."
        showDivider={false}
      >
        <div>
          <Label htmlFor="stock-form-product">Produto</Label>
          <Input
            id="stock-form-product"
            type="text"
            value={initialStock.productName ?? ''}
            disabled
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="stock-form-quantity">Quantidade</Label>
          <Input
            id="stock-form-quantity"
            name="quantity"
            type="number"
            step="1"
            min="0"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="0"
          />
        </div>
      </FormSectionLayout>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
