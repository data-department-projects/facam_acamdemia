/**
 * Enveloppe client : Gère l'affichage conditionnel (StudentLayout vs Sidebar classique).
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StudentLayout } from '@/components/layout/StudentLayout';
import { getStoredUser, type StoredUser } from '@/lib/auth';
import type { UserRole } from '@/types';

function getCompteHref(role: UserRole): string | undefined {
  if (role === 'admin' || role === 'platform_manager') return '/admin/compte';
  if (role === 'module_manager_internal' || role === 'module_manager_external')
    return '/module-manager/compte';
  return undefined;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const u = getStoredUser();
    if (!u) {
      router.replace('/login');
      return;
    }
    setUser(u);
  }, [mounted, pathname, router]);

  const handleMenuClick = () => setSidebarOpen((o) => !o);

  if (!mounted || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-facam-blue-tint">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-facam-blue border-t-transparent" />
      </div>
    );
  }

  // Layout spécifique Étudiant / Employé (Udemy Clone)
  if (user.role === 'student' || user.role === 'employee') {
    return <StudentLayout user={user}>{children}</StudentLayout>;
  }

  // Layout Classique (Admin / Manager)
  return (
    <div className="flex min-h-screen bg-facam-blue-tint">
      <Sidebar role={user.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          showSidebarToggle
          onMenuClick={handleMenuClick}
          user={{ fullName: user.fullName, email: user.email, role: user.role }}
          compteHref={getCompteHref(user.role)}
        />
        <main className="flex-1 bg-gray-50 p-4 md:p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
