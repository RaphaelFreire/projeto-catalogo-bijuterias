'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { Input } from '@/shared/components/ui/input';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet';
import { cn } from '@/shared/lib/class-name.util';
import { useCart } from '../context/cart.context';
import {
  listActiveProducts,
  listStorefrontCategories,
  type StorefrontCategory,
  type StorefrontProduct,
} from '../util/storefront-api.util';
import { ProductCard } from './product-card.component';

const CATEGORY_QUERY_PARAM = 'categoria';
const PER_PAGE = 15;

export function ProductGrid() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando produtos...</p>}>
      <ProductGridContent />
    </Suspense>
  );
}

function ProductGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(searchParams.get(CATEGORY_QUERY_PARAM) ?? '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const cart = useCart();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          listActiveProducts(),
          listStorefrontCategories(),
        ]);
        if (!cancelled) {
          setProducts(productsData);
          setCategories(categoriesData);
        }
      } catch {
        if (!cancelled) toast.error('Não foi possível carregar os produtos. Tente novamente.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mantém o filtro sincronizado com a URL: clicar num banner navega para
  // /loja?categoria=<id> sem remontar este componente, então o estado precisa
  // reagir à mudança de searchParams, não só ler o valor inicial na montagem.
  useEffect(() => {
    setCategoryId(searchParams.get(CATEGORY_QUERY_PARAM) ?? '');
  }, [searchParams]);

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(CATEGORY_QUERY_PARAM, value);
    } else {
      params.delete(CATEGORY_QUERY_PARAM);
    }
    router.replace(params.size > 0 ? `/loja?${params.toString()}` : '/loja');
  }

  function handleMobileCategorySelect(value: string) {
    handleCategoryChange(value);
    setFilterOpen(false);
  }

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = term === '' || product.name.toLowerCase().includes(term);
      const matchesCategory = categoryId === '' || product.categoryId === categoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryId]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filteredProducts, page],
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando produtos...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar produto..."
            className="pl-9"
          />
        </div>

        <div className="sm:hidden">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="relative shrink-0"
                aria-label="Filtrar por categoria"
              >
                <Filter className="size-4" />
                {categoryId ? (
                  <span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary" />
                ) : null}
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="flex flex-col gap-4">
              <SheetHeader>
                <SheetTitle>Filtrar por categoria</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleMobileCategorySelect('')}
                  className={cn(
                    'rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                    categoryId === '' && 'bg-accent font-medium',
                  )}
                >
                  Todas as categorias
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleMobileCategorySelect(category.id)}
                    className={cn(
                      'rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                      categoryId === category.id && 'bg-accent font-medium',
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <select
          value={categoryId}
          onChange={(event) => handleCategoryChange(event.target.value)}
          className={cn(
            'hidden h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block sm:w-56',
          )}
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyListState
          title="Nenhum produto encontrado"
          subtitle="Tente ajustar a busca ou o filtro de categoria."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={cart.items.find((item) => item.productId === product.id)?.quantity ?? 0}
                onAddToCart={() => {
                  const added = cart.addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] ?? null,
                    availableQuantity: product.quantity,
                  });
                  if (added) {
                    toast.success(`${product.name} adicionado ao carrinho!`);
                  } else {
                    toast.error(`Estoque insuficiente para ${product.name}.`);
                  }
                }}
              />
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            totalLabel="produtos"
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
