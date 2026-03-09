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
  { href: '/module-manager/modules', label: 'Modules & chapitres', icon: FolderOpen },
  { href: '/module-manager/quiz', label: 'Quiz', icon: FileQuestion },
  { href: '/module-manager/stats', label: 'Statistiques', icon: BarChart3 },
];

const adminNav = [
  { href: '/admin', label: 'Dashboard global', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Gestion utilisateurs', icon: Users },
];

const supportNav = [
  { href: '/support', label: 'Monitoring', icon: AlertCircle },
  { href: '/support/logs', label: 'Logs', icon: BarChart3 },
];

function getNavForRole(
  role: UserRole
): { href: string; label: string; icon: typeof LayoutDashboard }[] {
  switch (role) {
    case 'student':
      return studentNav;
    case 'module_manager':
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
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-facam-blue text-facam-white'
                  : 'text-facam-blue hover:bg-facam-blue/10'
              )}
              aria-current={isActive ? 'page' : undefined}
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
