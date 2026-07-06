'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
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
  deleteUser,
  listUsers,
  UsersApiError,
  type UserSummary,
} from '../util/users-api.util';

const PER_PAGE = 20;

export default function UsersListComponent() {
  const router = useRouter();
  const [items, setItems] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<UserSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const fetchPage = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const data = await listUsers(targetPage, PER_PAGE);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      if (error instanceof UsersApiError) {
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
      await deleteUser(pendingDelete.id);
      toast.success('Usuário excluído com sucesso!');
      setPendingDelete(null);
      const isLastItemOnPage = items.length === 1 && page > 1;
      await fetchPage(isLastItemOnPage ? page - 1 : page);
    } catch (error) {
      if (error instanceof UsersApiError) {
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
        badge="Usuários"
        title="Cadastro de usuários"
        subtitle="Gerencie os usuários com acesso ao sistema."
        aside={
          <Button type="button" onClick={() => router.push('/users/new')}>
            <UserPlus className="size-4" />
            Novo usuário
          </Button>
        }
      />

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : items.length === 0 ? (
        <EmptyListState
          title="Nenhum usuário cadastrado"
          subtitle='Comece criando o primeiro usuário pelo botão "Novo usuário".'
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/users/${user.id}`)}
                        aria-label={`Editar ${user.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(user)}
                        aria-label={`Excluir ${user.name}`}
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
            totalLabel="usuários"
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
        title="Excluir usuário"
        description="Esta ação remove o usuário selecionado de forma permanente."
        itemLabel="Usuário"
        itemValue={pendingDelete?.name ?? ''}
        isConfirming={deleting}
      />
    </div>
  );
}
