'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/context/auth.context';

type Mode = 'register' | 'login';

type ApiErrorResponse = {
  statusCode: number;
  errors?: string[];
  message?: string;
  path?: string;
  timestamp?: string;
};

type LoginSuccessResponse = {
  token: string;
  user: { id: string; name: string; email: string };
};

export default function JoinPage() {
  const auth = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [auth.status, router]);

  if (auth.status !== 'unauthenticated') {
    return null;
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        },
      );

      if (response.ok) {
        toast.success('Cadastro realizado com sucesso!');
        setName('');
        setEmail('');
        setPassword('');
        return;
      }

      let body: ApiErrorResponse | null = null;
      try {
        body = (await response.json()) as ApiErrorResponse;
      } catch {
        body = null;
      }

      const codes =
        body && Array.isArray(body.errors) && body.errors.length > 0
          ? body.errors
          : ['DEFAULT_API_ERROR'];

      for (const code of codes) {
        toast.error(getMessage(code));
      }
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as LoginSuccessResponse;
        auth.login(data.token);
        toast.success('Login efetuado com sucesso!');
        router.push('/dashboard');
        return;
      }

      let body: ApiErrorResponse | null = null;
      try {
        body = (await response.json()) as ApiErrorResponse;
      } catch {
        body = null;
      }

      const codes =
        body && Array.isArray(body.errors) && body.errors.length > 0
          ? body.errors
          : ['DEFAULT_API_ERROR'];

      for (const code of codes) {
        toast.error(getMessage(code));
      }
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <Layers className="size-7 text-amber-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">Aplicação</h1>
            <p className="mt-1 text-sm text-white/50">
              {mode === 'register'
                ? 'Crie sua conta para continuar'
                : 'Entre na sua conta para continuar'}
            </p>
          </div>
        </div>

        {mode === 'register' ? (
          <form
            onSubmit={handleRegisterSubmit}
            className="flex w-full flex-col gap-4"
          >
            <div>
              <Label htmlFor="register-name" className="text-white/70">
                Nome
              </Label>
              <Input
                id="register-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="bg-white/5 text-white placeholder:text-white/30"
                placeholder="Maria Silva"
              />
            </div>
            <div>
              <Label htmlFor="register-email" className="text-white/70">
                E-mail
              </Label>
              <Input
                id="register-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-white/5 text-white placeholder:text-white/30"
                placeholder="voce@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="register-password" className="text-white/70">
                Senha
              </Label>
              <Input
                id="register-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-white/5 text-white placeholder:text-white/30"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full bg-amber-400 font-bold text-black hover:bg-amber-300"
            >
              {submitting ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={handleLoginSubmit}
            className="flex w-full flex-col gap-4"
          >
            <div>
              <Label htmlFor="login-email" className="text-white/70">
                E-mail
              </Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-white/5 text-white placeholder:text-white/30"
                placeholder="voce@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="login-password" className="text-white/70">
                Senha
              </Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-white/5 text-white placeholder:text-white/30"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full bg-amber-400 font-bold text-black hover:bg-amber-300"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() =>
            setMode((current) => (current === 'register' ? 'login' : 'register'))
          }
          className="text-xs text-white/50 transition-colors hover:text-white/80"
        >
          {mode === 'register'
            ? 'Já tenho conta — Entrar'
            : 'Ainda não tenho conta — Cadastrar'}
        </button>

        <Link
          href="/"
          className="text-xs text-white/30 transition-colors hover:text-white/60"
        >
          ← Voltar para o início
        </Link>
      </div>
    </div>
  );
}
