/**
 * En-tête type Udemy : logo FACAM ACADEMIA, zone actions (connexion / inscription ou profil).
 * Charte FACAM (bleu, fond blanc, bordures légères).
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/Facam%20Academia-02-02%202.png';

export interface HeaderProps {
  onMenuClick?: () => void;
  showSidebarToggle?: boolean;
  user?: { fullName: string; email: string; role: string } | null;
  className?: string;
}

export function Header({
  onMenuClick,
  showSidebarToggle = false,
  user = null,
  className,
}: HeaderProps) {
  const handleMenuClick = () => {
    onMenuClick?.();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm',
        className
      )}
      role="banner"
    >
      {showSidebarToggle && (
        <button
          type="button"
          onClick={handleMenuClick}
          className="rounded-lg p-2 text-facam-blue hover:bg-facam-blue-tint focus:outline-none focus:ring-2 focus:ring-facam-blue"
          aria-label="Ouvrir le menu"
          tabIndex={0}
        >
          <Menu className="size-5" />
        </button>
      )}
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-facam-dark hover:opacity-90"
        aria-label="FACAM ACADEMIA - Accueil"
      >
        <Image
          src={LOGO_SRC}
          alt="FACAM ACADEMIA"
          width={140}
          height={40}
          className="h-9 w-auto object-contain"
          priority
        />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <span className="hidden text-sm font-medium text-facam-blue sm:inline-block">
              {user.fullName}
            </span>
            <span className="rounded-full bg-facam-blue-tint p-2 text-facam-blue" aria-hidden>
              <User className="size-4" />
            </span>
            <Link
              href="/login"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-facam-blue-tint"
              aria-label="Se déconnecter"
            >
              <LogOut className="size-4" />
            </Link>
          </>
        ) : (
          <Link href="/login">
            <Button variant="accent" size="sm">
              Connexion
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
