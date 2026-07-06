'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import {
  CategoriesApiError,
  createCategory,
  type CategorySummary,
  updateCategory,
} from '../util/categories-api.util';

type Mode = 'create' | 'edit';

type CategoryFormProps = {
  mode: Mode;
  initialCategory?: CategorySummary;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function CategoryForm({ mode, initialCategory, onSuccess, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initialCategory?.name ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    try {
      const payload = { name };

      if (mode === 'edit' && initialCategory) {
        await updateCategory(initialCategory.id, payload);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await createCategory(payload);
        toast.success('Categoria criada com sucesso!');
      }
      onSuccess();
    } catch (error) {
      if (error instanceof CategoriesApiError) {
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
        title="Dados básicos"
        description="Identificação da categoria no catálogo."
        showDivider={false}
      >
        <div>
          <Label htmlFor="category-form-name">Nome</Label>
          <Input
            id="category-form-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Camisetas"
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
