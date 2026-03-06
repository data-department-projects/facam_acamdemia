/**
 * Layout spécifique pour les étudiants (sans sidebar, header style Udemy).
 * Affiche le bandeau compte à rebours (30 jours depuis première connexion).
 */

'use client';

import { StudentHeader } from '@/components/layout/StudentHeader';
import { CountdownBanner } from '@/components/student/CountdownBanner';

export function StudentLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { fullName: string; email: string; role: string; firstLoginAt?: string | null };
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
            <a href="#" className="hover:underline">
              Aide
            </a>
            <a href="#" className="hover:underline">
              Confidentialité
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
