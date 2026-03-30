/**
 * Cours et contenus — Structure Module → Chapitres (sans niveau Cours).
 * Le responsable voit son module, peut modifier image et prérequis, puis gérer les chapitres (créer, modifier, supprimer).
 * Chaque chapitre peut avoir une vidéo et un quiz avec une ou plusieurs bonnes réponses.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  GripVertical,
  Video,
  FileQuestion,
  BookOpen,
  Pencil,
  Trash2,
  FileText,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { QuizBuilder, type QuizQuestionForm } from '@/components/module-manager/QuizBuilder';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { api, apiRequest } from '@/lib/api-client';

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
  items?: {
    id: string;
    type: string;
    title?: string;
    videoUrl?: string;
    documentUrl?: string | null;
    documentLabel?: string | null;
  }[];
  quizzes?: { id: string }[];
}

type ChapterFormData = {
  title: string;
  description: string;
  videoTitle: string;
  videoUrl: string;
  order: number;
};

/** Fichiers choisis localement avant envoi : seuls ceux encore dans la liste sont téléversés en base. */
type PendingChapterDoc = {
  clientId: string;
  file: File;
  title: string;
  label: string;
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
    prerequisites: '',
    learningObjectives: '',
  });
  const [moduleCoverFile, setModuleCoverFile] = useState<File | null>(null);

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
  const [pendingChapterDocs, setPendingChapterDocs] = useState<PendingChapterDoc[]>([]);
  const [uploadingChapterDoc, setUploadingChapterDoc] = useState(false);

  const DOC_ACCEPT =
    '.pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

  const addPendingChapterFiles = (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    setPendingChapterDocs((prev) => [
      ...prev,
      ...arr.map((file) => ({
        clientId: crypto.randomUUID(),
        file,
        title: file.name.replace(/\.[^.]+$/, '') || file.name,
        label: '',
      })),
    ]);
  };

  const removePendingChapterDoc = (clientId: string) => {
    setPendingChapterDocs((prev) => prev.filter((d) => d.clientId !== clientId));
  };

  const updatePendingChapterDoc = (
    clientId: string,
    patch: Partial<Pick<PendingChapterDoc, 'title' | 'label'>>
  ) => {
    setPendingChapterDocs((prev) =>
      prev.map((d) => (d.clientId === clientId ? { ...d, ...patch } : d))
    );
  };

  /** Téléverse une copie figée de la liste (évite les incohérences si l’état React change pendant les await). */
  const uploadDocListToChapter = async (chapterId: string, docs: PendingChapterDoc[]) => {
    for (const doc of docs) {
      const form = new FormData();
      form.append('file', doc.file);
      if (doc.title.trim()) form.append('title', doc.title.trim());
      if (doc.label.trim()) form.append('documentLabel', doc.label.trim());
      await apiRequest(`/chapitres/chapter/${chapterId}/documents`, {
        method: 'POST',
        body: form,
      });
    }
  };

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
      prerequisites: mod.prerequisites ?? '',
      learningObjectives: mod.learningObjectives ?? '',
    });
    setModuleCoverFile(null);
    setModuleEditModal(true);
  };

  const saveModuleEdit = async () => {
    if (!editingModuleId) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/formations/${editingModuleId}`, {
        prerequisites: moduleEditForm.prerequisites.trim() || undefined,
        learningObjectives: moduleEditForm.learningObjectives.trim() || undefined,
      });
      if (moduleCoverFile) {
        const form = new FormData();
        form.append('file', moduleCoverFile);
        await apiRequest<{ imageUrl: string }>(`/formations/${editingModuleId}/cover-image`, {
          method: 'POST',
          body: form,
        });
      }
      await loadModules();
      setModuleEditModal(false);
      setEditingModuleId(null);
      setModuleCoverFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur mise à jour module');
    } finally {
      setSaving(false);
    }
  };

  const openNewChapter = (moduleId: string) => {
    const list = chaptersByModule[moduleId] ?? [];
    setChapterModuleId(moduleId);
    setPendingChapterDocs([]);
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
    setPendingChapterDocs([]);
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
    /** Liste figée au clic sur Enregistrer : seuls ces fichiers partent en base si l’envoi réussit. */
    const docsAtSave = [...pendingChapterDocs];
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
                  correctIndexes: q.correctIndexes,
                }))
            : undefined,
        };
        const created = await api.post<{ id: string }>('/chapitres', payload);
        if (created?.id && docsAtSave.length > 0) {
          await uploadDocListToChapter(created.id, docsAtSave);
          const uploadedIds = new Set(docsAtSave.map((d) => d.clientId));
          setPendingChapterDocs((prev) => prev.filter((d) => !uploadedIds.has(d.clientId)));
        }
      } else if (editingChapterId) {
        await api.patch(`/chapitres/${editingChapterId}`, {
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || undefined,
          order: chapterForm.order,
        });
        if (docsAtSave.length > 0) {
          await uploadDocListToChapter(editingChapterId, docsAtSave);
          const uploadedIds = new Set(docsAtSave.map((d) => d.clientId));
          setPendingChapterDocs((prev) => prev.filter((d) => !uploadedIds.has(d.clientId)));
        }
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

  const handleReplaceChapterDocument = async (itemId: string, file: File) => {
    if (!chapterModuleId) return;
    setUploadingChapterDoc(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      await apiRequest(`/chapitres/items/${itemId}/document`, { method: 'POST', body: form });
      await loadChapters(chapterModuleId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur remplacement document');
    } finally {
      setUploadingChapterDoc(false);
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
          Module et chapitres (sans niveau Cours). Image de couverture et documents se téléversent
          vers Supabase (plus d’URL externe). Prérequis et objectifs du module, puis chapitres
          (vidéo YouTube, quiz ; documents PDF / Office téléversés depuis l’édition du chapitre).
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
                      <RichTextContent content={mod.prerequisites} className="mt-2" />
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
                              {ch.items?.some((i) => i.type === 'document' && i.documentUrl) && (
                                <FileText className="size-3 text-facam-blue" aria-hidden />
                              )}
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
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-facam-dark">
              Image de couverture (JPG, PNG, WebP — max. 5 Mo)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-gray-600"
              onChange={(e) => setModuleCoverFile(e.target.files?.[0] ?? null)}
            />
            {moduleCoverFile && (
              <p className="text-xs text-gray-600">
                Nouveau fichier sélectionné : {moduleCoverFile.name} (enregistré avec le
                formulaire).
              </p>
            )}
            <p className="text-xs text-gray-500">
              Stockage sécurisé Supabase. Laisser vide pour conserver l’image actuelle du module.
            </p>
          </div>
          <div>
            <RichTextEditor
              label="Prérequis"
              value={moduleEditForm.prerequisites}
              onChange={(html) => setModuleEditForm((f) => ({ ...f, prerequisites: html }))}
              placeholder="Connaissances nécessaires avant de suivre le module..."
            />
          </div>
          <div>
            <RichTextEditor
              label="Objectifs d'apprentissage"
              value={moduleEditForm.learningObjectives}
              onChange={(html) => setModuleEditForm((f) => ({ ...f, learningObjectives: html }))}
              placeholder="Ce que l'étudiant va apprendre, compétences acquises à la fin..."
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
          setPendingChapterDocs([]);
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
          <p className="text-xs text-gray-600 rounded-lg bg-facam-blue-tint/40 border border-facam-blue/15 px-3 py-2">
            Vous pouvez combiner une <strong>vidéo YouTube</strong>, un ou plusieurs{' '}
            <strong>documents</strong> (PDF, Office — stockés sur Supabase) et un{' '}
            <strong>quiz</strong>. Les documents choisis ci‑dessous sont enregistrés en base
            uniquement lorsque vous cliquez sur « Enregistrer ».
          </p>
          <Input
            label="Titre du chapitre"
            value={chapterForm.title}
            onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Introduction"
            required
          />
          <div>
            <label
              htmlFor="chapter-description"
              className="mb-1.5 block text-sm font-semibold text-facam-dark"
            >
              Description (optionnel)
            </label>
            <textarea
              id="chapter-description"
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
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-facam-dark">Documents à joindre (optionnel)</p>
            <p className="text-xs text-gray-500">
              Sélection illimitée de fichiers (PDF, PPTX, DOCX… — max. 50 Mo par fichier). La croix
              retire un fichier de la liste : il ne sera pas téléversé ni enregistré en base.
            </p>
            <div>
              <label
                htmlFor="chapter-pending-docs-input"
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-facam-blue hover:underline"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>Ajouter des fichiers</span>
              </label>
              <input
                id="chapter-pending-docs-input"
                type="file"
                className="sr-only"
                multiple
                accept={DOC_ACCEPT}
                disabled={saving || uploadingChapterDoc}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) addPendingChapterFiles(files);
                  e.target.value = '';
                }}
              />
            </div>
            {pendingChapterDocs.length > 0 && (
              <ul className="space-y-3 border-t border-gray-100 pt-3">
                {pendingChapterDocs.map((doc) => (
                  <li
                    key={doc.clientId}
                    className="relative rounded-lg border border-gray-200 bg-gray-50/80 p-3 pr-11"
                  >
                    <button
                      type="button"
                      aria-label={`Retirer ${doc.file.name} de la sélection`}
                      className="absolute right-2 top-2 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      onClick={() => removePendingChapterDoc(doc.clientId)}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="mb-2 truncate text-xs text-gray-600" title={doc.file.name}>
                      {doc.file.name}
                    </p>
                    <div className="space-y-2">
                      <Input
                        label="Titre affiché aux étudiants"
                        value={doc.title}
                        onChange={(e) =>
                          updatePendingChapterDoc(doc.clientId, { title: e.target.value })
                        }
                        placeholder="Ex. Support de cours"
                      />
                      <Input
                        label="Libellé du lien (optionnel)"
                        value={doc.label}
                        onChange={(e) =>
                          updatePendingChapterDoc(doc.clientId, { label: e.target.value })
                        }
                        placeholder="Télécharger le PDF"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {chapterModal === 'edit' && editingChapterId && chapterModuleId && (
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <p className="text-sm font-medium text-facam-dark">
                Documents (PDF, PPTX, DOCX… — max. 50 Mo)
              </p>
              <ul className="space-y-2 text-sm">
                {(
                  chaptersByModule[chapterModuleId]?.find((c) => c.id === editingChapterId)
                    ?.items ?? []
                )
                  .filter((i) => i.type === 'document' && i.documentUrl)
                  .map((doc) => (
                    <li
                      key={doc.id}
                      className="flex flex-wrap items-center gap-2 rounded border border-white bg-white/80 px-2 py-1.5"
                    >
                      <a
                        href={doc.documentUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-facam-blue underline truncate max-w-[200px]"
                      >
                        {doc.documentLabel ?? doc.title ?? 'Document'}
                      </a>
                      <label
                        htmlFor={`replace-doc-${doc.id}`}
                        className="text-xs text-facam-blue cursor-pointer hover:underline"
                      >
                        Remplacer le fichier
                      </label>
                      <input
                        id={`replace-doc-${doc.id}`}
                        type="file"
                        className="sr-only"
                        accept={DOC_ACCEPT}
                        disabled={uploadingChapterDoc}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleReplaceChapterDocument(doc.id, f);
                          e.target.value = '';
                        }}
                      />
                    </li>
                  ))}
              </ul>
              <p className="border-t border-gray-200 pt-3 text-xs text-gray-600">
                Les nouveaux fichiers se gèrent dans « Documents à joindre » juste au‑dessus :
                enregistrez le chapitre pour les envoyer en base.
              </p>
            </div>
          )}
          {chapterModal === 'new' && (
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="mb-2 text-sm font-medium text-facam-dark">
                Quiz de fin de chapitre (définir une ou plusieurs bonnes réponses)
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setChapterModal(null);
                setChapterModuleId(null);
                setEditingChapterId(null);
                setPendingChapterDocs([]);
              }}
            >
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
