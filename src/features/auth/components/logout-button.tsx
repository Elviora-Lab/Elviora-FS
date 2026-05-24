'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { cn } from '@/lib/cn';

import { Button, type ButtonProps } from '@/components/ui/button';

import { useAuth } from '../hooks/use-auth';

type LogoutButtonProps = Omit<ButtonProps, 'children' | 'onClick' | 'type'> & {
  redirectTo?: string;
};

export function LogoutButton({
  className,
  redirectTo = '/login',
  variant = 'ghost',
  size = 'md',
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    await signOut();
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      loading={isSigningOut}
      onClick={handleLogout}
      className={cn('justify-start', className)}
      {...props}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
