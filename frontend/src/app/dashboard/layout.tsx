'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/authStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage directly to avoid hydration issues
    const token = localStorage.getItem('token');

    if (!token && !isAuthenticated) {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Sidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}
