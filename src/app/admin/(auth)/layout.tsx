import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login do painel',
  robots: { index: false, follow: false },
};

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-deep px-4 py-10">{children}</div>;
}
