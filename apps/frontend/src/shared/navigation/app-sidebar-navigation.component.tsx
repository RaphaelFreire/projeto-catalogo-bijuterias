'use client';

import { usePathname } from 'next/navigation';
import { SidebarMenu, type ModuleNavigationEntry } from '@/shared/components/ui/sidebar-menu.component';

type Props = {
  modules: ModuleNavigationEntry[];
  defaultModuleId?: string;
};

function matchesHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isModuleActive(pathname: string, module: ModuleNavigationEntry): boolean {
  const hrefs = [
    module.item.href,
    module.mainItem?.href,
    ...module.sections.flatMap((section) => section.items.map((item) => item.href)),
  ].filter((href): href is string => Boolean(href));

  return hrefs.some((href) => matchesHref(pathname, href));
}

export function AppSidebarNavigation({ modules, defaultModuleId }: Props) {
  const pathname = usePathname();

  const active =
    modules.find((m) => isModuleActive(pathname, m)) ??
    modules.find((m) => m.item.id === defaultModuleId) ??
    modules[0];

  return (
    <SidebarMenu
      mainItem={active?.mainItem}
      sections={active?.sections ?? []}
      moduleNavigation={
        active
          ? { activeModuleId: active.item.id, items: modules }
          : undefined
      }
    />
  );
}
