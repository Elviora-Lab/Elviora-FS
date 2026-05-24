'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { clearAuthCookies } from '@/server/auth/cookies';

export async function logoutAction() {
  const jar = await cookies();
  clearAuthCookies(jar);
  redirect('/login');
}
