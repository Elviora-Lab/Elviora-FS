'use client';

import * as React from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';

import { cn } from '@/lib/cn';

import { Label } from '@/components/ui/label';

/**
 * Form context: wraps RHF's `FormProvider` to expose context to nested fields.
 */
export const Form = FormProvider;

type FormFieldContextValue<TName extends FieldPath<FieldValues> = FieldPath<FieldValues>> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

function useFormFieldContext() {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) throw new Error('useFormFieldContext must be used inside <FormField>');
  return ctx;
}

export function useFormField() {
  const ctx = useFormFieldContext();
  const { getFieldState, formState } = useFormContext();
  const state = getFieldState(ctx.name, formState);
  const id = `field-${ctx.name}`;
  return {
    id,
    name: ctx.name,
    formItemId: id,
    formDescriptionId: `${id}-description`,
    formMessageId: `${id}-message`,
    ...state,
  };
}

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

export function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField();
  return (
    <Label htmlFor={formItemId} className={cn(error && 'text-destructive', className)} {...props} />
  );
}

export function FormControl(props: React.HTMLAttributes<HTMLElement>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      {...props}
    />
  );
}

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { formDescriptionId } = useFormField();
  return (
    <p
      id={formDescriptionId}
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? '') : children;
  if (!body) return null;
  return (
    <p id={formMessageId} className={cn('text-xs text-destructive', className)} {...props}>
      {body}
    </p>
  );
}

// — local Slot to attach refs/ids without pulling in Radix Slot in every form
function Slot({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
  if (React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(child, { ...props, ...child.props });
  }
  return <>{children}</>;
}
