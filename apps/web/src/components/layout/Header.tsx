/**
 * En-tête type Udemy : logo FACAM ACADEMIA, zone actions (connexion / inscription ou profil).
 * Charte FACAM (bleu, fond blanc, bordures légères).
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, LogOut, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/Facam%20Academia-02-02%202.png';

type HeaderNavLink = {
  label: string;
  href: string;
};

type HeaderCta = {
  label: string;
  href: string;
};

function getHeaderTheme(variant: HeaderProps['variant']) {
  switch (variant) {
    case 'glass': {
      return {
        isMarketing: true,
        header:
          'border-b border-white/30 bg-white/60 text-facam-dark backdrop-blur supports-[backdrop-filter]:bg-white/50',
        menuButton:
          'text-facam-dark hover:bg-black/5 focus:ring-facam-blue/30 focus:ring-offset-transparent',
        brandText: 'text-facam-dark',
        logo: '',
        brandName: 'text-facam-dark',
        navLink:
          'text-[11px] font-semibold uppercase tracking-[0.22em] text-facam-dark/75 hover:text-facam-dark',
        navUnderline: 'bg-facam-yellow',
        userName: 'text-facam-blue',
        accountButton:
          'bg-facam-blue-tint text-facam-blue hover:bg-facam-blue/10 focus:ring-facam-blue focus:ring-offset-white',
        accountIcon: 'bg-facam-blue-tint text-facam-blue',
        logoutButton: 'hover:bg-facam-blue-tint',
        loginPill:
          'bg-facam-yellow text-facam-dark hover:brightness-105 shadow-facam-yellow focus-visible:ring-0 focus-visible:ring-offset-0',
        ctaPill:
          'rounded-full bg-facam-yellow px-5 text-facam-dark hover:brightness-105 shadow-facam-yellow focus-visible:ring-0 focus-visible:ring-offset-0',
      } as const;
    }
    case 'transparent': {
      return {
        isMarketing: true,
        header: 'border-b border-white/10 bg-transparent text-white',
        menuButton:
          'text-white hover:bg-white/10 focus:ring-white/60 focus:ring-offset-transparent',
        brandText: 'text-white',
        logo: 'brightness-0 invert',
        brandName: 'text-white',
        navLink:
          'text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 hover:text-white',
        navUnderline: 'bg-facam-yellow',
        userName: 'text-white/90',
        accountButton:
          'bg-white/10 text-white hover:bg-white/15 focus:ring-white/60 focus:ring-offset-transparent',
        accountIcon: 'bg-white/10 text-white',
        logoutButton: 'hover:bg-white/10',
        loginPill:
          'bg-facam-yellow text-facam-dark hover:brightness-105 shadow-facam-yellow focus-visible:ring-0 focus-visible:ring-offset-0',
        ctaPill:
          'rounded-full bg-facam-yellow px-5 text-facam-dark hover:brightness-105 shadow-facam-yellow focus-visible:ring-0 focus-visible:ring-offset-0',
      } as const;
    }
    case 'default':
    default: {
      return {
        isMarketing: false,
        header: 'border-b border-gray-200 bg-white text-facam-dark shadow-sm',
        menuButton:
          'text-facam-blue hover:bg-facam-blue-tint focus:ring-facam-blue focus:ring-offset-white',
        brandText: 'text-facam-dark',
        logo: '',
        brandName: 'text-facam-dark',
        navLink: '',
        navUnderline: 'bg-facam-yellow',
        userName: 'text-facam-blue',
        accountButton:
          'bg-facam-blue-tint text-facam-blue hover:bg-facam-blue/10 focus:ring-facam-blue focus:ring-offset-white',
        accountIcon: 'bg-facam-blue-tint text-facam-blue',
        logoutButton: 'hover:bg-facam-blue-tint',
        loginPill: '',
        ctaPill: '',
      } as const;
    }
  }
}

export interface HeaderProps {
  onMenuClick?: () => void;
  showSidebarToggle?: boolean;
  user?: { fullName: string; email: string; role: string } | null;
  /** Lien vers la page profil/compte (ex: /admin/compte, /module-manager/compte) */
  compteHref?: string;
  /**
   * Variante d'affichage.
   * - `default`: fond blanc + bordure (dashboard / pages internes)
   * - `transparent`: superposé au hero (marketing), texte clair
   * - `glass`: style inspiré (liens centrés + CTA)
   */
  variant?: 'default' | 'transparent' | 'glass';
  /** Liens de navigation (utile pour la home marketing). */
  navLinks?: HeaderNavLink[];
  /** Lien actif (underline). */
  activeHref?: string;
  /** CTA à droite (ex: “Consultation”). */
  cta?: HeaderCta;
  className?: string;
}

export function Header(props: Readonly<HeaderProps>) {
  const {
    onMenuClick,
    showSidebarToggle = false,
    user = null,
    compteHref,
    variant = 'default',
    navLinks,
    activeHref,
    cta,
    className,
  } = props;

  const theme = getHeaderTheme(variant);
  const isMarketing = theme.isMarketing;

  const handleMenuClick = () => onMenuClick?.();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center gap-4 px-4 transition-colors',
        theme.header,
        className
      )}
      role="banner"
    >
      {showSidebarToggle && (
        <button
          type="button"
          onClick={handleMenuClick}
          className={cn(
            'rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-offset-2',
            theme.menuButton
          )}
          aria-label="Ouvrir le menu"
          tabIndex={0}
        >
          <Menu className="size-5" />
        </button>
      )}
      <Link
        href="/"
        className={cn('flex items-center gap-2 font-bold hover:opacity-90', theme.brandText)}
        aria-label="FACAM ACADEMIA - Accueil"
      >
        <Image
          src={LOGO_SRC}
          alt="FACAM ACADEMIA"
          width={140}
          height={40}
          className={cn('h-9 w-auto object-contain', theme.logo)}
          priority
        />
        {isMarketing && (
          <span className={cn('hidden text-sm font-extrabold sm:inline-block', theme.brandName)}>
            FACAM ACADEMIA
          </span>
        )}
      </Link>

      {isMarketing && (navLinks?.length ?? 0) > 0 && (
        <nav className="hidden flex-1 items-center justify-center md:flex" aria-label="Navigation">
          <div className="flex items-center gap-8">
            {navLinks!.map((l) => {
              const isActive = activeHref ? l.href === activeHref : false;
              return (
                <Link key={l.href} href={l.href} className={cn('relative py-1', theme.navLink)}>
                  {l.label}
                  <span
                    className={cn(
                      'absolute -bottom-1 left-0 h-[2px] w-full opacity-0 transition-opacity',
                      theme.navUnderline,
                      isActive && 'opacity-100'
                    )}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      <div className={cn('ml-auto flex items-center gap-2', isMarketing && 'gap-3')}>
        {user ? (
          <>
            <span className={cn('hidden text-sm font-medium sm:inline-block', theme.userName)}>
              {user.fullName}
            </span>
            {compteHref ? (
              <Link
                href={compteHref}
                className={cn(
                  'rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                  theme.accountButton
                )}
                aria-label="Mon compte"
              >
                <User className="size-4" />
              </Link>
            ) : (
              <span className={cn('rounded-full p-2', theme.accountIcon)} aria-hidden>
                <User className="size-4" />
              </span>
            )}
            <Link
              href="/login"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-lg',
                theme.logoutButton
              )}
              aria-label="Se déconnecter"
            >
              <LogOut className="size-4" />
            </Link>
          </>
        ) : (
          <>
            {isMarketing && cta ? (
              <Link href={cta.href}>
                <Button size="sm" className={theme.ctaPill}>
                  {cta.label} <ArrowRight />
                </Button>
              </Link>
            ) : null}
            <Link
              href="/login"
              className="inline-flex focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0"
            >
              <Button
                size="sm"
                className={cn(
                  'rounded-full px-5 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                  theme.loginPill
                )}
                variant={isMarketing ? undefined : 'accent'}
              >
                Connexion <ArrowRight />
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
