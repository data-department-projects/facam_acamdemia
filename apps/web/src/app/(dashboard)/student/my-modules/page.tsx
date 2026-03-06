/**
 * Mes modules : liste des modules auxquels l'étudiant est inscrit ou en cours.
 * Vue condensée avec progression.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_MODULES } from '@/data/mock';

export default function StudentMyModulesPage() {
  const myModules = MOCK_MODULES.filter((m) => m.progress !== undefined);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mes modules</h1>
      <p className="text-slate-600">Vos modules en cours et terminés.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {myModules.map((mod) => (
          <Card key={mod.id} className="overflow-hidden">
            <div className="relative h-40 w-full bg-slate-200">
              <Image
                src={mod.imageUrl}
                alt={mod.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw, 33vw"
              />
              {mod.progress !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-300">
                  <div className="h-full bg-facam-blue" style={{ width: `${mod.progress}%` }} />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h2 className="font-semibold text-slate-900 line-clamp-2">{mod.title}</h2>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {mod.durationHours} h
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5" />
                  {mod.chaptersCount} ch.
                </span>
              </div>
              <Link href={`/student/modules/${mod.id}`} className="mt-3 block">
                <Button variant="outline" size="sm" className="w-full">
                  {mod.progress === 100 ? 'Voir certificat' : 'Reprendre'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
