/**
 * Barre latérale — navigation par rôle, charte FACAM (bleu actif, fond teinte).
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Users,
  AlertCircle,
  GraduationCap,
  FolderOpen,
  BarChart3,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const studentNav = [
  { href: '/student', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/student/modules', label: 'Catalogue des modules', icon: BookOpen },
  { href: '/student/my-modules', label: 'Mes modules', icon: GraduationCap },
];

const moduleManagerNav = [
  { href: '/module-manager', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/module-manager/modules', label: 'Cours & contenus', icon: FolderOpen },
  { href: '/module-manager/quiz', label: 'Quiz', icon: FileQuestion },
  { href: '/module-manager/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/module-manager/compte', label: 'Mon compte', icon: UserCircle },
];

const adminNav = [
  { href: '/admin', label: 'Dashboard global', icon: LayoutDashboard },
  { href: '/admin/modules', label: 'Gestion des modules', icon: BookOpen },
  { href: '/admin/users', label: 'Gestion utilisateurs', icon: Users },
  { href: '/admin/compte', label: 'Mon compte', icon: UserCircle },
];

const supportNav = [
  { href: '/support', label: 'Monitoring', icon: AlertCircle },
  { href: '/support/feedbacks', label: 'Feedback etudiant', icon: Users },
  { href: '/support/logs', label: 'Logs', icon: BarChart3 },
];

function getNavForRole(
  role: UserRole
): { href: string; label: string; icon: typeof LayoutDashboard }[] {
  switch (role) {
    case 'student':
    case 'employee':
      return studentNav;
    case 'module_manager_internal':
    case 'module_manager_external':
      return moduleManagerNav;
    case 'admin':
    case 'platform_manager':
      return adminNav;
    case 'support':
      return supportNav;
    default:
      return studentNav;
  }
}

export interface SidebarProps {
  role: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ role, isOpen = true, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const nav = getNavForRole(role);

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-gray-200 bg-facam-blue-tint/50 transition-transform',
        !isOpen && '-translate-x-full lg:translate-x-0',
        className
      )}
      role="navigation"
      aria-label="Menu principal"
    >
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {nav.map((item) => {
          // Lien actif = celui qui correspond le mieux au path (évite que Dashboard reste bleu sur toute sous-page)
          const exactMatch = pathname === item.href;
          const prefixMatch = item.href !== '/' && pathname.startsWith(item.href + '/');
          const isActive = exactMatch || prefixMatch;
          const matchLength = exactMatch ? item.href.length : prefixMatch ? item.href.length : 0;
          const bestMatch = Math.max(
            ...nav.map((i) =>
              pathname === i.href
                ? i.href.length
                : pathname.startsWith(i.href + '/')
                  ? i.href.length
                  : 0
            )
          );
          const isActiveFinal = isActive && matchLength === bestMatch;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                isActiveFinal
                  ? 'bg-facam-blue text-facam-white'
                  : 'text-facam-blue hover:bg-facam-blue/10'
              )}
              aria-current={isActiveFinal ? 'page' : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
