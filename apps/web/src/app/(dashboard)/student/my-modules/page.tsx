/**
 * Mes modules — Liste des modules auxquels l’étudiant est inscrit (GET /formations).
 * Vue condensée avec progression depuis la base de données.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

interface ApiModule {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  chaptersCount?: number;
  progress?: number;
  completedAt?: string | null;
}

export default function StudentMyModulesPage() {
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: ApiModule[] }>('/formations?limit=50')
      .then((res) => {
        if (!cancelled) setModules(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setModules([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const imgSrc = (url?: string) => url || '/placeholder-course.jpg';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mes modules</h1>
      <p className="text-slate-600">Vos modules en cours et terminés.</p>

      {loading ? (
        <p className="text-gray-500">Chargement…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Card key={mod.id} className="overflow-hidden">
              <div className="relative h-40 w-full bg-slate-200">
                <Image
                  src={imgSrc(mod.imageUrl)}
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
                    <BookOpen className="size-3.5" />
                    {mod.chaptersCount ?? 0} ch.
                  </span>
                </div>
                <Link
                  href={
                    mod.progress === 100
                      ? `/student/modules/${mod.id}`
                      : `/student/modules/${mod.id}/chapitre/1`
                  }
                  className="mt-3 block"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    {mod.progress === 100 ? 'Voir certificat' : 'Reprendre'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && modules.length === 0 && (
        <p className="text-gray-500">
          Aucun module. Inscrivez-vous à un module depuis le catalogue.
        </p>
      )}
    </div>
  );
}
