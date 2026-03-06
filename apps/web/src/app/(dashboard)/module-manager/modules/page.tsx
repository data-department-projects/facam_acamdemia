/**
 * Éditeur modules & chapitres : liste des modules, ajout, réorganisation (drag & drop simulé).
 * Liens vers édition des chapitres et ressources (vidéos / docs).
 */

import { Plus, GripVertical, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MOCK_MODULES, MOCK_CHAPTERS } from '@/data/mock';

export default function ModuleManagerModulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Modules et chapitres</h1>
        <Button>
          <Plus className="mr-2 size-4" />
          Nouveau module
        </Button>
      </div>

      <div className="space-y-4">
        {MOCK_MODULES.map((mod) => {
          const chapters = MOCK_CHAPTERS.filter((c) => c.moduleId === mod.id).sort(
            (a, b) => a.order - b.order
          );
          return (
            <Card key={mod.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                    <Button variant="ghost" size="sm">
                      Paramètres
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-600">{mod.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Chapitres</p>
                  {chapters.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucun chapitre. Ajoutez-en un.</p>
                  ) : (
                    chapters.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3"
                      >
                        <GripVertical className="size-4 text-slate-400" aria-hidden />
                        <span className="flex-1 font-medium text-slate-900">{ch.title}</span>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          {ch.videoUrl && <Video className="size-3" />}
                          {ch.documentUrls.length} doc(s)
                        </span>
                        <Button variant="ghost" size="sm">
                          Éditer
                        </Button>
                      </div>
                    ))
                  )}
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="mr-1 size-4" />
                    Ajouter un chapitre
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Liaison SharePoint (docs) et YouTube (vidéos) à configurer côté backend.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
