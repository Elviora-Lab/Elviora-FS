import { redirect } from 'next/navigation';

// Customer accounts are disabled — the storefront is guest-only. Any hit to an
// /account/* route sends the visitor back to the shop. (Admins use /admin.)
export default function AccountLayout(_props: { children: React.ReactNode }) {
  redirect('/');
}
