'use client';

import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { normalizeError } from '@/services/api';

import { analytics } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';

import { useLoginMutation } from '../api/auth-api';
import { useAuth } from '../hooks/use-auth';
import { type LoginInput, loginSchema } from '../schemas/auth-schemas';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'STAFF']);

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectParam = search.get('redirect');
  const { signIn } = useAuth();
  const [login, { isLoading }] = useLoginMutation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const session = await login({ email: values.email, password: values.password }).unwrap();
      signIn(session.user);
      analytics.login('password');
      analytics.setUser({ userId: session.user.id });
      toast.success('Welcome back');
      // If we have an explicit redirect (gated route), honor it.
      // Otherwise send admins to /admin and customers to /account.
      const destination =
        redirectParam ?? (ADMIN_ROLES.has(session.user.role) ? '/admin' : '/account');
      router.push(destination);
      router.refresh(); // refresh RSC trees so they pick up the new session cookie
    } catch (err) {
      const e = normalizeError(err);
      toast.error(e.message);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" loading={isLoading} className="mt-2" data-no-track>
          Sign in
        </Button>
      </form>
    </Form>
  );
}
