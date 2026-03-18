/**
 * Cours et contenus — Structure Module → Chapitres (sans niveau Cours).
 * Le responsable voit son module, peut modifier image et prérequis, puis gérer les chapitres (créer, modifier, supprimer).
 * Chaque chapitre peut avoir une vidéo et un quiz avec bonne réponse pour noter l'étudiant.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, GripVertical, Video, FileQuestion, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { QuizBuilder, type QuizQuestionForm } from '@/components/module-manager/QuizBuilder';
import { api } from '@/lib/api-client';

interface ApiModule {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  prerequisites?: string | null;
  learningObjectives?: string | null;
}

interface ApiChapter {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  items?: { id: string; type: string; title?: string; videoUrl?: string }[];
  quizzes?: { id: string }[];
}

type ChapterFormData = {
  title: string;
  description: string;
  videoTitle: string;
  videoUrl: string;
  order: number;
};

export default function ModuleManagerModulesPage() {
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [chaptersByModule, setChaptersByModule] = useState<Record<string, ApiChapter[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [moduleEditModal, setModuleEditModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleEditForm, setModuleEditForm] = useState({
    imageUrl: '',
    prerequisites: '',
    learningObjectives: '',
  });

  const [chapterModal, setChapterModal] = useState<'new' | 'edit' | null>(null);
  const [chapterModuleId, setChapterModuleId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState<ChapterFormData>({
    title: '',
    description: '',
    videoTitle: '',
    videoUrl: '',
    order: 1,
  });
  const [chapterQuizQuestions, setChapterQuizQuestions] = useState<QuizQuestionForm[]>([]);
  const [chapterQuizMinScore, setChapterQuizMinScore] = useState(70);

  const [chapterToDelete, setChapterToDelete] = useState<{
    moduleId: string;
    chapterId: string;
    title: string;
  } | null>(null);
  const [deletingChapter, setDeletingChapter] = useState(false);

  const loadModules = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<{ data: ApiModule[] }>('/formations?limit=100');
      setModules(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChapters = useCallback(async (moduleId: string) => {
    try {
      const list = await api.get<ApiChapter[]>(`/chapitres/module/${moduleId}`);
      setChaptersByModule((prev) => ({
        ...prev,
        [moduleId]: Array.isArray(list) ? list.sort((a, b) => a.order - b.order) : [],
      }));
    } catch {
      setChaptersByModule((prev) => ({ ...prev, [moduleId]: [] }));
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  useEffect(() => {
    modules.forEach((m) => {
      if (chaptersByModule[m.id] === undefined) loadChapters(m.id);
    });
  }, [modules, chaptersByModule, loadChapters]);

  const openModuleEdit = (mod: ApiModule) => {
    setEditingModuleId(mod.id);
    setModuleEditForm({
      imageUrl: mod.imageUrl ?? '',
      prerequisites: mod.prerequisites ?? '',
      learningObjectives: mod.learningObjectives ?? '',
    });
    setModuleEditModal(true);
  };

  const saveModuleEdit = async () => {
    if (!editingModuleId) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/formations/${editingModuleId}`, {
        imageUrl: moduleEditForm.imageUrl.trim() || undefined,
        prerequisites: moduleEditForm.prerequisites.trim() || undefined,
        learningObjectives: moduleEditForm.learningObjectives.trim() || undefined,
      });
      await loadModules();
      setModuleEditModal(false);
      setEditingModuleId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur mise à jour module');
    } finally {
      setSaving(false);
    }
  };

  const openNewChapter = (moduleId: string) => {
    const list = chaptersByModule[moduleId] ?? [];
    setChapterModuleId(moduleId);
    setChapterForm({
      title: '',
      description: '',
      videoTitle: '',
      videoUrl: '',
      order: list.length + 1,
    });
    setChapterQuizQuestions([]);
    setChapterQuizMinScore(70);
    setEditingChapterId(null);
    setChapterModal('new');
  };

  const openEditChapter = (moduleId: string, ch: ApiChapter) => {
    setChapterModuleId(moduleId);
    setEditingChapterId(ch.id);
    setChapterForm({
      title: ch.title,
      description: ch.description ?? '',
      videoTitle: '',
      videoUrl: '',
      order: ch.order,
    });
    setChapterQuizQuestions([]);
    setChapterQuizMinScore(70);
    setChapterModal('edit');
  };

  const saveChapter = async () => {
    if (!chapterModuleId) return;
    setSaving(true);
    setError(null);
    try {
      if (chapterModal === 'new') {
        const payload = {
          moduleId: chapterModuleId,
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || undefined,
          order: chapterForm.order,
          videoTitle: chapterForm.videoTitle.trim() || undefined,
          videoUrl: chapterForm.videoUrl.trim() || undefined,
          minScoreToPass: chapterQuizMinScore,
          quizQuestions: chapterQuizQuestions.some(
            (q) => q.questionText.trim() && q.options.some((o) => o.trim())
          )
            ? chapterQuizQuestions
                .filter((q) => q.questionText.trim() && q.options.some((o) => o.trim()))
                .map((q) => ({
                  questionText: q.questionText,
                  options: q.options,
                  correctIndex: q.correctIndex,
                }))
            : undefined,
        };
        await api.post('/chapitres', payload);
      } else if (editingChapterId) {
        await api.patch(`/chapitres/${editingChapterId}`, {
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || undefined,
          order: chapterForm.order,
        });
      }
      await loadChapters(chapterModuleId);
      setChapterModal(null);
      setChapterModuleId(null);
      setEditingChapterId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur enregistrement chapitre');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteChapter = async () => {
    if (!chapterToDelete) return;
    setDeletingChapter(true);
    setError(null);
    try {
      await api.delete(`/chapitres/${chapterToDelete.chapterId}`);
      await loadChapters(chapterToDelete.moduleId);
      setChapterToDelete(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur suppression');
    } finally {
      setDeletingChapter(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-facam-dark">Cours et contenus</h1>
        <p className="mt-1 text-sm text-gray-600">
          Module et chapitres (sans niveau Cours). Vous pouvez modifier l&apos;image et les
          prérequis du module, puis gérer les chapitres (création, modification, suppression).
          Chaque chapitre peut inclure une vidéo et un quiz ; la bonne réponse permet de noter
          l&apos;étudiant et de le faire passer au chapitre suivant si le score minimum est atteint.
        </p>
      </div>
      {error && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun module assigné. L&apos;administrateur doit vous attribuer un module.
        </p>
      ) : (
        <div className="space-y-6">
          {modules.map((mod) => {
            const chapters = (chaptersByModule[mod.id] ?? []).sort((a, b) => a.order - b.order);
            return (
              <Card key={mod.id} className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {mod.imageUrl && (
                        <Image
                          src={mod.imageUrl}
                          alt={`Couverture du module ${mod.title}`}
                          width={96}
                          height={56}
                          className="h-14 w-24 rounded object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      )}
                      <CardTitle className="text-lg">{mod.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModuleEdit(mod)}
                        aria-label="Modifier le module"
                      >
                        <Pencil className="mr-1 size-4" />
                        Modifier le module
                      </Button>
                      <Link href={`/module-manager/modules/${mod.id}/quiz`}>
                        <Button variant="outline" size="sm">
                          <FileQuestion className="mr-1 size-4" />
                          Quiz final
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm text-gray-600">{mod.description ?? ''}</p>
                  {mod.prerequisites && (
                    <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-sm">
                      <span className="font-medium text-gray-700">Prérequis :</span>{' '}
                      {mod.prerequisites}
                    </div>
                  )}

                  <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <BookOpen className="size-4 text-facam-blue" />
                      <span className="font-semibold text-facam-dark">Chapitres</span>
                    </div>
                    <div className="space-y-2">
                      {chapters.length === 0 ? (
                        <p className="text-sm text-gray-500">Aucun chapitre.</p>
                      ) : (
                        chapters.map((ch) => (
                          <div
                            key={ch.id}
                            className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"
                          >
                            <GripVertical className="size-4 shrink-0 text-gray-400" aria-hidden />
                            <span className="flex-1 font-medium text-facam-dark">{ch.title}</span>
                            <span className="flex items-center gap-2 text-xs text-gray-500">
                              {ch.items?.some((i) => i.videoUrl) && <Video className="size-3" />}
                              {(ch.quizzes?.length ?? 0) > 0 && (
                                <span className="text-amber-600">Quiz</span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditChapter(mod.id, ch)}
                              aria-label="Modifier le chapitre"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() =>
                                setChapterToDelete({
                                  moduleId: mod.id,
                                  chapterId: ch.id,
                                  title: ch.title,
                                })
                              }
                              aria-label="Supprimer le chapitre"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))
                      )}
                      <Button
                        variant="accent"
                        size="sm"
                        className="mt-2"
                        onClick={() => openNewChapter(mod.id)}
                      >
                        <Plus className="mr-1 size-4" />
                        Ajouter un chapitre
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal : Compléter les infos du module (image, prérequis, objectifs) */}
      <Modal
        open={moduleEditModal}
        onClose={() => {
          setModuleEditModal(false);
          setEditingModuleId(null);
        }}
        title="Compléter les informations du module"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveModuleEdit();
          }}
          className="space-y-4"
        >
          <Input
            label="URL de l'image d'affichage"
            value={moduleEditForm.imageUrl}
            onChange={(e) => setModuleEditForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500">
            Cette image sera affichée sur l&apos;interface étudiant pour représenter le module.
          </p>
          <div>
            <label
              htmlFor="module-prerequisites"
              className="mb-1.5 block text-sm font-semibold text-facam-dark"
            >
              Prérequis
            </label>
            <textarea
              id="module-prerequisites"
              value={moduleEditForm.prerequisites}
              onChange={(e) => setModuleEditForm((f) => ({ ...f, prerequisites: e.target.value }))}
              placeholder="Connaissances nécessaires avant de suivre le module..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="module-learning-objectives"
              className="mb-1.5 block text-sm font-semibold text-facam-dark"
            >
              Objectifs d&apos;apprentissage
            </label>
            <textarea
              id="module-learning-objectives"
              value={moduleEditForm.learningObjectives}
              onChange={(e) =>
                setModuleEditForm((f) => ({ ...f, learningObjectives: e.target.value }))
              }
              placeholder="Ce que l'étudiant va apprendre, compétences acquises à la fin..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModuleEditModal(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal : Ajouter ou modifier un chapitre */}
      <Modal
        open={chapterModal !== null}
        onClose={() => {
          setChapterModal(null);
          setChapterModuleId(null);
          setEditingChapterId(null);
        }}
        title={chapterModal === 'edit' ? 'Modifier le chapitre' : 'Ajouter un chapitre'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveChapter();
          }}
          className="space-y-4"
        >
          <Input
            label="Titre du chapitre"
            value={chapterForm.title}
            onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Introduction"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-facam-dark">
              Description (optionnel)
            </label>
            <textarea
              value={chapterForm.description}
              onChange={(e) => setChapterForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Courte description du chapitre..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {chapterModal === 'new' && (
            <>
              <Input
                label="Titre de la vidéo (YouTube)"
                value={chapterForm.videoTitle}
                onChange={(e) => setChapterForm((f) => ({ ...f, videoTitle: e.target.value }))}
                placeholder="Ex. Démonstration"
              />
              <Input
                label="Lien de la vidéo (YouTube)"
                value={chapterForm.videoUrl}
                onChange={(e) => setChapterForm((f) => ({ ...f, videoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </>
          )}
          <Input
            label="Ordre"
            type="number"
            min={1}
            value={chapterForm.order}
            onChange={(e) =>
              setChapterForm((f) => ({
                ...f,
                order: Number.parseInt(e.target.value, 10) || 1,
              }))
            }
          />
          {chapterModal === 'new' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="mb-2 text-sm font-medium text-facam-dark">
                Quiz de fin de chapitre (définir la bonne réponse pour noter l&apos;étudiant)
              </p>
              <p className="mb-3 text-xs text-gray-500">
                Score minimum requis pour passer au chapitre suivant.
              </p>
              <QuizBuilder
                title="Questions"
                questions={chapterQuizQuestions}
                onChange={setChapterQuizQuestions}
                minScoreToPass={chapterQuizMinScore}
                onMinScoreChange={setChapterQuizMinScore}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setChapterModal(null)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmation de suppression d'un chapitre */}
      <Modal
        open={chapterToDelete !== null}
        onClose={() => !deletingChapter && setChapterToDelete(null)}
        title="Supprimer le chapitre"
      >
        {chapterToDelete && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Êtes-vous sûr de vouloir supprimer le chapitre{' '}
              <strong>{chapterToDelete.title}</strong> ? Les contenus et quiz associés seront
              supprimés. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setChapterToDelete(null)}
                disabled={deletingChapter}
              >
                Annuler
              </Button>
              <Button
                variant="accent"
                className="bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteChapter}
                disabled={deletingChapter}
              >
                {deletingChapter ? 'Suppression…' : 'Supprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
