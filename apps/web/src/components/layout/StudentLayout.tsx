/**
 * Layout spécifique pour les étudiants (sans sidebar, header style Udemy).
 * Affiche le bandeau compte à rebours (30 jours depuis première connexion).
 */

'use client';

import Link from 'next/link';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { CountdownBanner } from '@/components/student/CountdownBanner';
import { useStudentIdleLogout } from '@/hooks/useStudentIdleLogout';

/**
 * Active la déconnexion après inactivité sans rendre de DOM (hook seulement).
 */
function StudentIdleSessionGuard() {
  useStudentIdleLogout();
  return null;
}

export function StudentLayout({
  children,
  user,
}: {
  readonly children: React.ReactNode;
  readonly user: {
    fullName: string;
    email: string;
    role: string;
    firstLoginAt?: string | null;
    avatarUrl?: string | null;
  };
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StudentIdleSessionGuard />
      <StudentHeader user={user} />
      <CountdownBanner
        firstLoginAt={user.firstLoginAt ?? null}
        callToAction="Accélérez le développement de vos compétences"
      />
      <main className="flex-1">{children}</main>
      <footer className="bg-facam-dark text-white py-8 mt-auto">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-sm">© {new Date().getFullYear()} FACAM ACADEMIA</div>
          <div className="flex gap-4 text-sm">
            <Link href="/student/help" className="hover:underline">
              Aide
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
