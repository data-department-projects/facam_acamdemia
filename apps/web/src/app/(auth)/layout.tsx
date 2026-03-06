/**
 * Layout Auth Split Screen — Côté gauche : illustration étudiant style moderne (image2).
 * Côté droit : formulaire (login, etc.).
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { BarChart3 } from 'lucide-react';

const LOGO_SRC = '/Facam%20Academia-02-02%202.png';

export default function AuthLayout({ children }: { readonly children: React.ReactNode }) {
  const formRef = useRef<HTMLDivElement>(null);
  const leftSideRef = useRef<HTMLDivElement>(null);
  const floatingCard1Ref = useRef<HTMLDivElement>(null);
  const floatingCard2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animation Formulaire
    gsap.fromTo(
      formRef.current,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
    );

    // Animation Côté Gauche (Fade In)
    gsap.fromTo(
      leftSideRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: 'power2.out' }
    );

    // Animation Cartes Flottantes
    gsap.fromTo(
      floatingCard1Ref.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.6, ease: 'back.out(1.7)' }
    );
    gsap.fromTo(
      floatingCard2Ref.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.8, ease: 'back.out(1.7)' }
    );
  }, []);

  return (
    <div className="min-h-screen flex bg-white overflow-hidden font-montserrat">
      {/* Côté Gauche : Design Sophistiqué (Cercles + Étudiant + Widgets) */}
      <div
        ref={leftSideRef}
        className="hidden lg:flex w-1/2 relative bg-[#F0F4FA] items-center justify-center overflow-hidden"
      >
        {/* Cercles concentriques en arrière-plan (Style Image 2) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Grand cercle externe */}
          <div className="w-[800px] h-[800px] rounded-full border border-facam-blue/5 opacity-60 absolute" />
          <div className="w-[650px] h-[650px] rounded-full border border-facam-blue/10 opacity-70 absolute" />
          {/* Cercle principal coloré (fond derrière l'étudiant) */}
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-br from-facam-blue/10 to-facam-blue/5 absolute blur-3xl" />
          <div className="w-[450px] h-[450px] rounded-full border-[2px] border-facam-blue/20 absolute" />

          {/* Petits cercles décoratifs */}
          <div className="absolute top-[15%] right-[20%] w-4 h-4 rounded-full bg-facam-yellow opacity-80" />
          <div className="absolute bottom-[20%] left-[15%] w-6 h-6 rounded-full bg-facam-blue/20" />
          <div className="absolute top-[30%] left-[10%] w-3 h-3 rounded-full bg-facam-blue opacity-40" />
        </div>

        {/* Image Étudiant (Centrale) */}
        <div className="relative z-10 w-[400px] h-[550px] flex items-end justify-center">
          {/* Note: Pour un effet "détouré" parfait comme l'image2, il faudrait une image PNG transparente. 
                Ici on utilise une image rectangulaire avec un mask ou border-radius pour s'intégrer proprement. 
                On va utiliser un style "carte flottante" ou "image arrondie" propre. */}
          <div className="relative w-full h-full rounded-[40px] overflow-hidden shadow-2xl border-4 border-white transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
            <Image
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
              alt="Étudiant FACAM"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay gradient léger en bas */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>

        {/* Widget Flottant 1 (Haut Gauche) : "175K Assisted Students" */}
        <div
          ref={floatingCard1Ref}
          className="absolute top-[25%] left-[10%] xl:left-[15%] z-20 bg-white p-4 rounded-2xl shadow-facam-lg border border-gray-100 flex items-center gap-4 max-w-[240px]"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
              >
                <Image
                  src={`https://i.pravatar.cc/100?img=${i + 10}`}
                  alt="User"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-facam-yellow flex items-center justify-center text-[10px] font-bold text-facam-dark">
              +2k
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-facam-dark">2,5k+</p>
            <p className="text-xs text-gray-500 font-medium">Étudiants formés</p>
          </div>
        </div>

        {/* Widget Flottant 2 (Bas Gauche) : "Learning Chart" */}
        <div
          ref={floatingCard2Ref}
          className="absolute bottom-[20%] left-[8%] xl:left-[12%] z-20 bg-white p-5 rounded-2xl shadow-facam-lg border border-gray-100 w-[200px]"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-facam-dark">Progression</p>
            <BarChart3 className="w-4 h-4 text-facam-blue" />
          </div>
          <div className="flex items-end justify-between gap-2 h-[60px]">
            {[40, 70, 50, 90, 60].map((h, i) => (
              <div
                key={`bar-${i}`}
                className={`w-2 rounded-t-sm ${i === 3 ? 'bg-facam-yellow' : 'bg-gray-100'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-[10px] text-gray-400 font-medium">+24% ce mois</p>
          </div>
        </div>
      </div>

      {/* Côté Droit : Formulaire */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-16 relative bg-white">
        <div className="absolute top-8 left-8">
          <Link href="/">
            <Image
              src={LOGO_SRC}
              alt="FACAM Logo"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <div ref={formRef} className="w-full max-w-md space-y-8">
          {children}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} FACAM ACADEMIA. Tous droits réservés.
        </div>
      </div>
    </div>
  );
}
