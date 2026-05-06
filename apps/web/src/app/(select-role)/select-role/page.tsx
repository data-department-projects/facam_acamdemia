/**
 * Page de sélection d'interface — Affichée après connexion quand l'utilisateur possède
 * plusieurs rôles donnant accès à des interfaces distinctes.
 * Chaque carte représente un espace (Apprenant, Responsable de module, etc.).
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getStoredUser, setActiveRole, signOutFullClient } from '@/lib/auth';
import { getRoleHome, getDistinctInterfaces, getInterfaceForRole, ROLE_LABELS } from '@/types';
import type { UserRole, InterfaceType } from '@/types';

const LOGO_SRC = '/Facam%20Academia-02-02%202.png';

interface InterfaceOption {
  role: UserRole;
  interfaceType: InterfaceType;
  label: string;
  description: string;
  imageSrc: string;
  accentClass: string;
  roleCaption: string;
}

function buildInterfaceOptions(roles: readonly UserRole[]): InterfaceOption[] {
  const distinct = getDistinctInterfaces(roles);
  return distinct.map((role) => {
    const interfaceType = getInterfaceForRole(role);
    return {
      role,
      interfaceType,
      label: getInterfaceLabel(interfaceType),
      description: getInterfaceDescription(interfaceType),
      imageSrc: getInterfaceImage(interfaceType),
      accentClass: getInterfaceAccent(interfaceType),
      roleCaption: ROLE_LABELS[role] ?? role,
    };
  });
}

function getInterfaceLabel(interfaceType: InterfaceType): string {
  const labels: Record<InterfaceType, string> = {
    student: 'Espace Apprenant',
    'module-manager': 'Espace Responsable',
    admin: 'Espace Administration',
    support: 'Espace Support',
  };
  return labels[interfaceType];
}

function getInterfaceDescription(interfaceType: InterfaceType): string {
  const descriptions: Record<InterfaceType, string> = {
    student:
      'Accédez à vos modules, vos ressources et vos évaluations dans une interface claire et fluide.',
    'module-manager':
      'Pilotez vos modules, suivez les apprenants et gérez vos contenus avec une vue complète.',
    admin: "Administrer la plateforme, gérer les utilisateurs et configurer l'application.",
    support: 'Consulter les tickets de support et accompagner les utilisateurs.',
  };
  return descriptions[interfaceType];
}

function getInterfaceImage(interfaceType: InterfaceType): string {
  const images: Record<InterfaceType, string> = {
    student: '/F12.jpg',
    'module-manager': '/F11.jpg',
    admin: '/F14.jpg',
    support: '/F18.jpg',
  };
  return images[interfaceType];
}

function getInterfaceAccent(interfaceType: InterfaceType): string {
  const accents: Record<InterfaceType, string> = {
    student: 'ring-facam-blue/40',
    'module-manager': 'ring-emerald-400/50',
    admin: 'ring-violet-400/50',
    support: 'ring-amber-400/50',
  };
  return accents[interfaceType];
}

export default function SelectRolePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; roles: UserRole[] } | null>(null);
  const [options, setOptions] = useState<InterfaceOption[]>([]);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }
    const roles = stored.roles?.length ? stored.roles : [stored.role];
    const distinctOptions = buildInterfaceOptions(roles);
    if (distinctOptions.length <= 1) {
      const role = roles[0] ?? 'student';
      setActiveRole(role);
      router.replace(getRoleHome(role));
      return;
    }
    setUser({ fullName: stored.fullName, roles });
    setOptions(distinctOptions);
  }, [router]);

  const handleSelect = (option: InterfaceOption): void => {
    if (selecting) return;
    setSelecting(true);
    setActiveRole(option.role);
    router.push(getRoleHome(option.role));
  };

  const handleLogout = async (): Promise<void> => {
    await signOutFullClient();
    router.replace('/login');
  };

  if (!user || options.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-facam-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.14),transparent_32%)]" />
      <div className="relative mb-10">
        <Image
          src={LOGO_SRC}
          alt="FACAM Academia"
          width={240}
          height={72}
          className="h-20 w-auto object-contain brightness-0 invert"
          priority
        />
      </div>
      <div className="relative mb-10 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
          Bienvenue, {user.fullName}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-slate-300">
          Vous avez accès à plusieurs espaces. Choisissez l'interface que vous souhaitez utiliser.
        </p>
      </div>
      <div className="relative grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.interfaceType}
            type="button"
            onClick={() => handleSelect(option)}
            disabled={selecting}
            className={`group relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 text-left shadow-2xl ring-1 ${option.accentClass} transition-all duration-300 hover:-translate-y-1 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <div className="absolute inset-0">
              <Image
                src={option.imageSrc}
                alt={option.label}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/25 via-slate-900/55 to-slate-900/90" />
            </div>
            <div className="relative flex min-h-[22rem] flex-col justify-end p-6 sm:min-h-96">
              <span className="mb-3 inline-flex w-fit items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {option.roleCaption}
              </span>
              <h2 className="mb-2 text-2xl font-semibold text-white">{option.label}</h2>
              <p className="text-sm leading-relaxed text-slate-200">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="relative mt-10 text-sm text-slate-300 transition-colors hover:text-red-300"
      >
        Se déconnecter
      </button>
    </div>
  );
}
