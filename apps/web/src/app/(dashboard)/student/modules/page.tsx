/**
 * Catalogue des modules : liste avec preview (image, titre, description, durée).
 * Liens vers la page détail de chaque module.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_MODULES } from '@/data/mock';

export default function StudentModulesCataloguePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Catalogue des modules</h1>
      <p className="text-slate-600">
        Choisissez un module pour accéder aux cours, ressources et quiz.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_MODULES.map((mod) => (
          <Card key={mod.id} className="overflow-hidden flex flex-col">
            <div className="relative h-48 w-full bg-slate-200">
              <Image
                src={mod.imageUrl}
                alt={mod.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {mod.progress !== undefined && mod.progress > 0 && (
                <div className="absolute bottom-2 left-2 right-2 h-1.5 rounded-full bg-slate-300">
                  <div
                    className="h-full rounded-full bg-facam-blue"
                    style={{ width: `${mod.progress}%` }}
                  />
                </div>
              )}
            </div>
            <CardContent className="flex-1 pt-4">
              <h2 className="font-semibold text-slate-900 line-clamp-2">{mod.title}</h2>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{mod.description}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {mod.durationHours} h
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5" />
                  {mod.chaptersCount} chapitres
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/student/modules/${mod.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  {mod.progress === 100
                    ? 'Voir le module'
                    : mod.progress && mod.progress > 0
                      ? 'Reprendre'
                      : 'Commencer'}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
