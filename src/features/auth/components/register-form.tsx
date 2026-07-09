'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { normalizeError } from '@/services/api';

import { analytics } from '@/lib/analytics';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/form';

import { useRegisterMutation } from '../api/auth-api';
import { useAuth } from '../hooks/use-auth';
import { type RegisterInput, registerSchema } from '../schemas/auth-schemas';

export function RegisterForm() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [register, { isLoading }] = useRegisterMutation();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false as unknown as true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const session = await register({
        name: values.name,
        email: values.email,
        password: values.password,
      }).unwrap();
      signIn(session.user);
      analytics.signUp('password');
      analytics.setUser({ userId: session.user.id });
      toast.success('Account created');
      router.push('/account');
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
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
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>
                At least 8 characters, with upper-case, lower-case and a number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem>
              <label className="flex cursor-pointer items-start gap-3 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border accent-foreground"
                />
                <span>
                  I agree to the{' '}
                  <a href="/terms" className="text-foreground underline">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-foreground underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" loading={isLoading} className="mt-2">
          Create account
        </Button>
      </form>
    </Form>
  );
}
