'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { getMessage } from '@/shared/i18n';
import { cn } from '@/shared/lib/class-name.util';
import { listAllCategories, type CategorySummary } from '../util/categories-api.util';
import {
  createProduct,
  PRODUCT_STATUSES,
  ProductsApiError,
  removeProductImage,
  type ProductStatus,
  type ProductSummary,
  updateProduct,
  uploadProductImage,
} from '../util/products-api.util';

const MAX_IMAGES = 8;

type Mode = 'create' | 'edit';

type ProductFormProps = {
  mode: Mode;
  initialProduct?: ProductSummary;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ProductForm({ mode, initialProduct, onSuccess, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [price, setPrice] = useState<string>(
    initialProduct ? String(initialProduct.price) : '',
  );
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status ?? 'draft');
  const [quantity, setQuantity] = useState<string>(
    initialProduct ? String(initialProduct.quantity) : '0',
  );
  const [bestSeller, setBestSeller] = useState(initialProduct?.bestSeller ?? false);
  const [dailyDeal, setDailyDeal] = useState(initialProduct?.dailyDeal ?? false);
  const [lastUnits, setLastUnits] = useState(initialProduct?.lastUnits ?? false);
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId ?? '');
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const items = await listAllCategories();
        if (!cancelled) setCategories(items);
      } catch {
        if (!cancelled) toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    }
    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const urls = pendingFiles.map((file) => URL.createObjectURL(file));
    setPendingPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingFiles]);

  const totalImageCount = mode === 'edit' ? images.length : pendingFiles.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice)) {
      toast.error(getMessage('product.price.required'));
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity)) {
      toast.error(getMessage('stock.quantity.required'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description: description.trim() === '' ? null : description.trim(),
        price: parsedPrice,
        status,
        bestSeller,
        dailyDeal,
        lastUnits,
        categoryId: categoryId === '' ? null : categoryId,
        quantity: parsedQuantity,
      };

      if (mode === 'edit' && initialProduct) {
        await updateProduct(initialProduct.id, payload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        const created = await createProduct(payload);
        for (const file of pendingFiles) {
          try {
            await uploadProductImage(created.id, file);
          } catch {
            toast.error(`Não foi possível enviar a imagem "${file.name}".`);
          }
        }
        toast.success('Produto criado com sucesso!');
      }
      onSuccess();
    } catch (error) {
      if (error instanceof ProductsApiError) {
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

  function handleSelectFile(file: File) {
    if (mode === 'edit' && initialProduct) {
      void handleUploadImage(file);
      return;
    }
    setPendingFiles((current) => [...current, file]);
  }

  async function handleUploadImage(file: File) {
    if (!initialProduct) return;
    setUploadingImage(true);
    try {
      const result = await uploadProductImage(initialProduct.id, file);
      setImages(result.images);
      toast.success('Imagem adicionada com sucesso!');
    } catch (error) {
      if (error instanceof ProductsApiError) {
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

  async function handleRemoveImage(url: string) {
    if (!initialProduct) return;
    try {
      await removeProductImage(initialProduct.id, url);
      setImages((current) => current.filter((image) => image !== url));
      toast.success('Imagem removida com sucesso!');
    } catch (error) {
      if (error instanceof ProductsApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    }
  }

  function handleRemovePendingFile(index: number) {
    setPendingFiles((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSectionLayout title="Dados básicos" description="Identificação do produto no catálogo.">
        <div>
          <Label htmlFor="product-form-name">Nome</Label>
          <Input
            id="product-form-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do produto"
          />
        </div>
        <div>
          <Label htmlFor="product-form-description">Descrição</Label>
          <Textarea
            id="product-form-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descreva o produto (opcional)"
          />
        </div>
        <div>
          <Label htmlFor="product-form-category">Categoria</Label>
          <select
            id="product-form-category"
            name="categoryId"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Preço e status" description="Defina o preço e a disponibilidade do produto.">
        <div>
          <Label htmlFor="product-form-price">Preço</Label>
          <Input
            id="product-form-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="product-form-quantity">Quantidade em estoque</Label>
          <Input
            id="product-form-quantity"
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
        <div>
          <Label htmlFor="product-form-status">Status</Label>
          <select
            id="product-form-status"
            name="status"
            required
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus)}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {PRODUCT_STATUSES.map((option) => (
              <option key={option} value={option}>
                {getMessage(`product.status.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Disponibilidade"
        description="Configure como o produto aparece para o cliente."
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id="product-form-best-seller"
            checked={bestSeller}
            onCheckedChange={(checked) => setBestSeller(checked === true)}
          />
          <Label htmlFor="product-form-best-seller" className="cursor-pointer">
            Mais vendido
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="product-form-daily-deal"
            checked={dailyDeal}
            onCheckedChange={(checked) => setDailyDeal(checked === true)}
          />
          <Label htmlFor="product-form-daily-deal" className="cursor-pointer">
            Oferta do dia
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="product-form-last-units"
            checked={lastUnits}
            onCheckedChange={(checked) => setLastUnits(checked === true)}
          />
          <Label htmlFor="product-form-last-units" className="cursor-pointer">
            Últimas unidades
          </Label>
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Imagens"
        description="Adicione ou remova imagens da galeria do produto (máximo de 8)."
        showDivider={false}
      >
        <div className="flex flex-wrap gap-3">
          {mode === 'edit'
            ? images.map((url) => (
                <div key={url} className="relative size-24 overflow-hidden rounded-md border border-input">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Imagem do produto" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => void handleRemoveImage(url)}
                    aria-label="Remover imagem"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))
            : pendingPreviews.map((url, index) => (
                <div key={url} className="relative size-24 overflow-hidden rounded-md border border-input">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Imagem do produto" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePendingFile(index)}
                    aria-label="Remover imagem"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || totalImageCount >= MAX_IMAGES}
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="size-5" />
            <span className="text-xs">{uploadingImage ? 'Enviando...' : 'Adicionar'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleSelectFile(file);
            }}
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
