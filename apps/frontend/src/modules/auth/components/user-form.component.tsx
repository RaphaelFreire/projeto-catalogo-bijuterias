'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import {
  createUser,
  updateUser,
  UsersApiError,
  type UserSummary,
} from '../util/users-api.util';

type Mode = 'create' | 'edit';

type UserFormProps = {
  mode: Mode;
  initialUser?: UserSummary;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function UserForm({ mode, initialUser, onSuccess, onCancel }: UserFormProps) {
  const [name, setName] = useState(initialUser?.name ?? '');
  const [email, setEmail] = useState(initialUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordHint =
    mode === 'edit'
      ? 'Deixe em branco para manter a senha atual.'
      : 'Mínimo de 8 caracteres com maiúscula, minúscula, número e caractere especial.';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmation) {
      toast.error(getMessage('user.password.confirmation.mismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        ...(password ? { password } : {}),
      };

      if (mode === 'edit' && initialUser) {
        await updateUser(initialUser.id, payload);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await createUser(payload);
        toast.success('Usuário criado com sucesso!');
      }
      onSuccess();
    } catch (error) {
      if (error instanceof UsersApiError) {
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
      <FormSectionLayout title="Dados básicos" description="Identificação do usuário no sistema.">
        <div>
          <Label htmlFor="user-form-name">Nome</Label>
          <Input
            id="user-form-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Maria Silva"
          />
        </div>
        <div>
          <Label htmlFor="user-form-email">E-mail</Label>
          <Input
            id="user-form-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Senha" description={passwordHint} showDivider={false}>
        <div>
          <Label htmlFor="user-form-password">Senha</Label>
          <Input
            id="user-form-password"
            name="password"
            type="password"
            required={mode === 'create'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="user-form-confirmation">Confirmação</Label>
          <Input
            id="user-form-confirmation"
            name="confirmation"
            type="password"
            required={mode === 'create'}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
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
