'use client';

import { useRouter } from 'next/navigation';
import { Boxes, ClipboardList, GalleryHorizontal, LayoutDashboard, Package, Settings, Tag, Users } from 'lucide-react';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import { AppSidebarNavigation } from '@/shared/navigation/app-sidebar-navigation.component';
import type { ModuleNavigationEntry } from '@/shared/components/ui/sidebar-menu.component';
import { AuthGuard } from '@/modules/auth/guard/auth.guard';
import { useAuth } from '@/modules/auth/context/auth.context';

// ── Rotas ─────────────────────────────────────────────────────────────────────

const DASHBOARD_ROUTE = '/dashboard';
const USERS_ROUTE = '/users';
const PRODUCTS_ROUTE = '/products';
const CATEGORIES_ROUTE = '/categories';
const STOCK_ROUTE = '/stock';
const ORDERS_ROUTE = '/orders';
const BANNERS_ROUTE = '/banners';
const SETTINGS_ROUTE = '/settings';

// ── Estrutura de navegação ─────────────────────────────────────────────────────
// Adicione, remova ou reordene módulos e seções aqui para refletir no menu lateral.

const APP_MODULES: ModuleNavigationEntry[] = [
  {
    item: {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Db',
      href: DASHBOARD_ROUTE,
      icon: LayoutDashboard,
    },
    sections: [
      {
        id: 'dashboard-main',
        label: 'Dashboard',
        items: [
          {
            id: 'dashboard-overview',
            label: 'Dashboard',
            href: DASHBOARD_ROUTE,
            icon: LayoutDashboard,
            match: 'exact',
          },
        ],
      },
    ],
  },
  {
    item: {
      id: 'auth',
      label: 'Acesso',
      shortLabel: 'Ac',
      href: USERS_ROUTE,
      icon: Users,
    },
    sections: [
      {
        id: 'auth-main',
        label: 'Acesso',
        items: [
          {
            id: 'auth-users',
            label: 'Usuários',
            href: USERS_ROUTE,
            icon: Users,
          },
        ],
      },
    ],
  },
  {
    item: {
      id: 'catalog',
      label: 'Catálogo',
      shortLabel: 'Ca',
      href: PRODUCTS_ROUTE,
      icon: Package,
    },
    sections: [
      {
        id: 'catalog-main',
        label: 'Catálogo',
        items: [
          {
            id: 'catalog-products',
            label: 'Produtos',
            href: PRODUCTS_ROUTE,
            icon: Package,
          },
          {
            id: 'catalog-categories',
            label: 'Categorias',
            href: CATEGORIES_ROUTE,
            icon: Tag,
          },
          {
            id: 'catalog-stock',
            label: 'Estoque',
            href: STOCK_ROUTE,
            icon: Boxes,
          },
          {
            id: 'catalog-orders',
            label: 'Pedidos',
            href: ORDERS_ROUTE,
            icon: ClipboardList,
          },
        ],
      },
    ],
  },
  {
    item: {
      id: 'settings',
      label: 'Configurações',
      shortLabel: 'Cf',
      href: SETTINGS_ROUTE,
      icon: Settings,
    },
    sections: [
      {
        id: 'settings-main',
        label: 'Configurações',
        items: [
          {
            id: 'settings-store',
            label: 'Configurações',
            href: SETTINGS_ROUTE,
            icon: Settings,
            match: 'exact',
          },
          {
            id: 'settings-banners',
            label: 'Banners',
            href: BANNERS_ROUTE,
            icon: GalleryHorizontal,
          },
        ],
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth();

  return (
    <AuthGuard>
      <ShellProvider defaultOpen>
        <AdminShell
          sidebar={<AppSidebarNavigation modules={APP_MODULES} defaultModuleId="dashboard" />}
          userName={auth.user?.name}
          userEmail={auth.user?.email}
          onLogout={() => {
            auth.logout();
            router.push('/join');
          }}
        >
          {children}
        </AdminShell>
      </ShellProvider>
    </AuthGuard>
  );
}
