/**
 * Modules et chapitres — Liste des modules avec formulaires (Nouveau module, Modifier,
 * Ajouter un chapitre, Éditer chapitre). Chaque formulaire s'ouvre dans une modal.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, GripVertical, Video, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { QuizBuilder, type QuizQuestionForm } from '@/components/module-manager/QuizBuilder';
import { MOCK_MODULES, MOCK_CHAPTERS } from '@/data/mock';
import type { Module, Chapter } from '@/types';

type ModuleFormData = { title: string; description: string };
type ChapterFormData = {
  title: string;
  description: string;
  videoUrl: string;
  order: number;
};

export default function ModuleManagerModulesPage() {
  const [modules, setModules] = useState<Module[]>(MOCK_MODULES);
  const [chapters, setChapters] = useState<Chapter[]>(MOCK_CHAPTERS);

  const [moduleModal, setModuleModal] = useState<'new' | 'edit' | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({ title: '', description: '' });

  const [chapterModal, setChapterModal] = useState<'new' | 'edit' | null>(null);
  const [chapterModuleId, setChapterModuleId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState<ChapterFormData>({
    title: '',
    description: '',
    videoUrl: '',
    order: 1,
  });
  const [chapterQuizQuestions, setChapterQuizQuestions] = useState<QuizQuestionForm[]>([]);
  const [chapterQuizMinScore, setChapterQuizMinScore] = useState(70);

  const openNewModule = () => {
    setModuleForm({ title: '', description: '' });
    setModuleModal('new');
  };

  const openEditModule = (mod: Module) => {
    setEditingModuleId(mod.id);
    setModuleForm({ title: mod.title, description: mod.description });
    setModuleModal('edit');
  };

  const saveModule = () => {
    if (moduleModal === 'new') {
      const newMod: Module = {
        ...modules[0],
        id: `m-${Date.now()}`,
        title: moduleForm.title,
        description: moduleForm.description,
        imageUrl: modules[0]?.imageUrl ?? '',
        durationHours: 0,
        chaptersCount: 0,
      };
      setModules([...modules, newMod]);
    } else if (editingModuleId) {
      setModules(
        modules.map((m) =>
          m.id === editingModuleId
            ? { ...m, title: moduleForm.title, description: moduleForm.description }
            : m
        )
      );
    }
    setModuleModal(null);
    setEditingModuleId(null);
  };

  const openNewChapter = (moduleId: string) => {
    const nextOrder = chapters.filter((c) => c.moduleId === moduleId).length + 1;
    setChapterModuleId(moduleId);
    setChapterForm({
      title: '',
      description: '',
      videoUrl: '',
      order: nextOrder,
    });
    setChapterQuizQuestions([]);
    setChapterQuizMinScore(70);
    setChapterModal('new');
  };

  const openEditChapter = (ch: Chapter) => {
    setChapterModuleId(ch.moduleId);
    setEditingChapterId(ch.id);
    setChapterForm({
      title: ch.title,
      description: (ch as { description?: string }).description ?? '',
      videoUrl: ch.videoUrl ?? '',
      order: ch.order,
    });
    setChapterQuizQuestions([]);
    setChapterQuizMinScore(70);
    setChapterModal('edit');
  };

  const saveChapter = () => {
    if (!chapterModuleId) return;
    if (chapterModal === 'new') {
      const newCh: Chapter = {
        id: `c-${Date.now()}`,
        moduleId: chapterModuleId,
        title: chapterForm.title,
        order: chapterForm.order,
        documentUrls: [],
        videoUrl: chapterForm.videoUrl || undefined,
      };
      setChapters([...chapters, newCh]);
      setModules(
        modules.map((m) =>
          m.id === chapterModuleId ? { ...m, chaptersCount: (m.chaptersCount ?? 0) + 1 } : m
        )
      );
    } else if (editingChapterId) {
      setChapters(
        chapters.map((c) =>
          c.id === editingChapterId
            ? {
                ...c,
                title: chapterForm.title,
                videoUrl: chapterForm.videoUrl || undefined,
                order: chapterForm.order,
              }
            : c
        )
      );
    }
    setChapterModal(null);
    setChapterModuleId(null);
    setEditingChapterId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-facam-dark">Modules et chapitres</h1>
        <Button variant="accent" onClick={openNewModule}>
          <Plus className="mr-2 size-4" />
          Nouveau module
        </Button>
      </div>

      <div className="space-y-4">
        {modules.map((mod) => {
          const modChapters = chapters
            .filter((c) => c.moduleId === mod.id)
            .sort((a, b) => a.order - b.order);
          return (
            <Card key={mod.id} className="border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModule(mod)}>
                      Modifier
                    </Button>
                    <Link href={`/module-manager/modules/${mod.id}/quiz`}>
                      <Button variant="outline" size="sm">
                        <FileQuestion className="mr-1 size-4" />
                        Gérer les quiz
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-gray-600">{mod.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Chapitres</p>
                  {modChapters.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun chapitre. Ajoutez-en un.</p>
                  ) : (
                    modChapters.map((ch) => (
                      <div
                        key={ch.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 p-3"
                      >
                        <GripVertical className="size-4 text-gray-400" aria-hidden />
                        <span className="flex-1 font-medium text-facam-dark">{ch.title}</span>
                        <span className="flex items-center gap-2 text-xs text-gray-500">
                          {ch.videoUrl && <Video className="size-3" />}
                          {ch.documentUrls?.length ?? 0} doc(s)
                          {ch.quizId && <span className="text-facam-yellow">Quiz</span>}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => openEditChapter(ch)}>
                          Éditer
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
                <p className="mt-3 text-xs text-gray-500">
                  Liaison SharePoint (docs) et YouTube (vidéos) à configurer côté backend.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Nouveau / Modifier module */}
      <Modal
        open={moduleModal !== null}
        onClose={() => {
          setModuleModal(null);
          setEditingModuleId(null);
        }}
        title={moduleModal === 'new' ? 'Nouveau module' : 'Modifier le module'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveModule();
          }}
          className="space-y-4"
        >
          <Input
            label="Titre"
            value={moduleForm.title}
            onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Maintenance industrielle"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-facam-dark">
              Description
            </label>
            <textarea
              value={moduleForm.description}
              onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description du module..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="accent">
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={() => setModuleModal(null)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Nouveau / Modifier chapitre */}
      <Modal
        open={chapterModal !== null}
        onClose={() => {
          setChapterModal(null);
          setChapterModuleId(null);
          setEditingChapterId(null);
        }}
        title={chapterModal === 'new' ? 'Ajouter un chapitre' : 'Modifier le chapitre'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveChapter();
          }}
          className="space-y-4"
        >
          <Input
            label="Titre"
            value={chapterForm.title}
            onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Introduction à la maintenance"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-facam-dark">
              Description
            </label>
            <textarea
              value={chapterForm.description}
              onChange={(e) => setChapterForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description du chapitre..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <Input
            label="URL vidéo (YouTube)"
            value={chapterForm.videoUrl}
            onChange={(e) => setChapterForm((f) => ({ ...f, videoUrl: e.target.value }))}
            placeholder="https://youtube.com/watch?v=..."
          />
          <Input
            label="Ordre"
            type="number"
            min={1}
            value={chapterForm.order}
            onChange={(e) =>
              setChapterForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 1 }))
            }
          />

          {/* Quiz de ce chapitre */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <p className="text-sm font-medium text-facam-dark mb-2">
              Quiz de ce chapitre (optionnel)
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Créez ou modifiez le quiz qui apparaîtra après la vidéo pour l&apos;étudiant.
            </p>
            <QuizBuilder
              title="Questions du quiz"
              questions={chapterQuizQuestions}
              onChange={setChapterQuizQuestions}
              minScoreToPass={chapterQuizMinScore}
              onMinScoreChange={setChapterQuizMinScore}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="accent">
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={() => setChapterModal(null)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
