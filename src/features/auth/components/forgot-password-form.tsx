'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';

import { normalizeError } from '@/services/api';

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

import { useForgotPasswordMutation } from '../api/auth-api';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await forgot(values).unwrap();
      setSent(true);
    } catch (err) {
      toast.error(normalizeError(err).message);
    }
  });

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        If an account exists for that email, a secure reset link is on its way. Check your inbox.
      </p>
    );
  }

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
        <Button type="submit" size="lg" loading={isLoading} className="mt-2">
          Send reset link
        </Button>
      </form>
    </Form>
  );
}
