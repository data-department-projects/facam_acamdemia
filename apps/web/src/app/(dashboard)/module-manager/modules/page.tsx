/**
 * Mon module — Cours et chapitres (spec Module → Cours → Chapitres).
 * Le responsable ne voit que le module qui lui est assigné.
 * Données : GET /formations (filtré), GET /courses?moduleId=, GET /chapitres/course/:id.
 * Création : POST /courses, POST /chapitres (avec description, vidéo YouTube, quiz).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, GripVertical, Video, FileQuestion, BookOpen } from 'lucide-react';
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
}

interface ApiCourse {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  chapters?: ApiChapter[];
}

interface ApiChapter {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  items?: { id: string; type: string; title?: string; videoUrl?: string }[];
  quizzes?: { id: string }[];
}

type CourseFormData = { title: string; description: string };
type ChapterFormData = {
  title: string;
  description: string;
  videoTitle: string;
  videoUrl: string;
  order: number;
};

export default function ModuleManagerModulesPage() {
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [coursesByModule, setCoursesByModule] = useState<Record<string, ApiCourse[]>>({});
  const [chaptersByCourse, setChaptersByCourse] = useState<Record<string, ApiChapter[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseModal, setCourseModal] = useState(false);
  const [courseModuleId, setCourseModuleId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormData>({ title: '', description: '' });

  const [chapterModal, setChapterModal] = useState<'new' | null>(null);
  const [chapterCourseId, setChapterCourseId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState<ChapterFormData>({
    title: '',
    description: '',
    videoTitle: '',
    videoUrl: '',
    order: 1,
  });
  const [chapterQuizQuestions, setChapterQuizQuestions] = useState<QuizQuestionForm[]>([]);
  const [chapterQuizMinScore, setChapterQuizMinScore] = useState(70);

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

  const loadCourses = useCallback(async (moduleId: string) => {
    try {
      const list = await api.get<ApiCourse[]>(`/courses?moduleId=${encodeURIComponent(moduleId)}`);
      setCoursesByModule((prev) => ({ ...prev, [moduleId]: Array.isArray(list) ? list : [] }));
    } catch {
      setCoursesByModule((prev) => ({ ...prev, [moduleId]: [] }));
    }
  }, []);

  const loadChapters = useCallback(async (courseId: string) => {
    try {
      const list = await api.get<ApiChapter[]>(`/chapitres/course/${courseId}`);
      setChaptersByCourse((prev) => ({ ...prev, [courseId]: Array.isArray(list) ? list : [] }));
    } catch {
      setChaptersByCourse((prev) => ({ ...prev, [courseId]: [] }));
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  useEffect(() => {
    modules.forEach((m) => {
      if (!coursesByModule[m.id]) loadCourses(m.id);
    });
  }, [modules, coursesByModule, loadCourses]);

  useEffect(() => {
    Object.keys(coursesByModule).forEach((moduleId) => {
      (coursesByModule[moduleId] ?? []).forEach((c) => {
        if (chaptersByCourse[c.id] === undefined) loadChapters(c.id);
      });
    });
  }, [coursesByModule, chaptersByCourse, loadChapters]);

  const openNewCourse = (moduleId: string) => {
    setCourseModuleId(moduleId);
    setCourseForm({ title: '', description: '' });
    setCourseModal(true);
  };

  const saveCourse = async () => {
    if (!courseModuleId) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/courses', {
        moduleId: courseModuleId,
        title: courseForm.title.trim(),
        description: courseForm.description.trim() || undefined,
      });
      await loadCourses(courseModuleId);
      setCourseModal(false);
      setCourseModuleId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur création cours');
    } finally {
      setSaving(false);
    }
  };

  const openNewChapter = (courseId: string) => {
    const list = chaptersByCourse[courseId] ?? [];
    setChapterCourseId(courseId);
    setChapterForm({
      title: '',
      description: '',
      videoTitle: '',
      videoUrl: '',
      order: list.length + 1,
    });
    setChapterQuizQuestions([]);
    setChapterQuizMinScore(70);
    setChapterModal('new');
  };

  const saveChapter = async () => {
    if (!chapterCourseId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        courseId: chapterCourseId,
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
      await loadChapters(chapterCourseId);
      setChapterModal(null);
      setChapterCourseId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur enregistrement chapitre');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-facam-dark">Mon module — Cours et chapitres</h1>
        <p className="mt-1 text-sm text-gray-600">
          Vous ne voyez que le module qui vous est assigné. Créez des cours, puis des chapitres
          (titre, description, vidéo YouTube, quiz) dans chaque cours.
        </p>
      </div>
      {error && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun module assigné. L’administrateur doit vous attribuer un module.
        </p>
      ) : (
        <div className="space-y-6">
          {modules.map((mod) => {
            const courses = (coursesByModule[mod.id] ?? []).sort((a, b) => a.order - b.order);
            return (
              <Card key={mod.id} className="border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{mod.title}</CardTitle>
                    <Link href={`/module-manager/modules/${mod.id}/quiz`}>
                      <Button variant="outline" size="sm">
                        <FileQuestion className="mr-1 size-4" />
                        Quiz final
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-gray-600">{mod.description ?? ''}</p>

                  {courses.map((course) => {
                    const chapters = (chaptersByCourse[course.id] ?? []).sort(
                      (a, b) => a.order - b.order
                    );
                    return (
                      <div
                        key={course.id}
                        className="mb-6 rounded-lg border border-gray-200 bg-gray-50/30 p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="size-4 text-facam-blue" />
                          <span className="font-semibold text-facam-dark">{course.title}</span>
                        </div>
                        {course.description && (
                          <p className="mb-3 text-sm text-gray-600">{course.description}</p>
                        )}
                        <div className="space-y-2">
                          {chapters.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucun chapitre.</p>
                          ) : (
                            chapters.map((ch) => (
                              <div
                                key={ch.id}
                                className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"
                              >
                                <GripVertical className="size-4 text-gray-400" aria-hidden />
                                <span className="flex-1 font-medium text-facam-dark">
                                  {ch.title}
                                </span>
                                <span className="flex items-center gap-2 text-xs text-gray-500">
                                  {ch.items?.some((i) => i.videoUrl) && (
                                    <Video className="size-3" />
                                  )}
                                  {(ch.quizzes?.length ?? 0) > 0 && (
                                    <span className="text-amber-600">Quiz</span>
                                  )}
                                </span>
                              </div>
                            ))
                          )}
                          <Button
                            variant="accent"
                            size="sm"
                            className="mt-2"
                            onClick={() => openNewChapter(course.id)}
                          >
                            <Plus className="mr-1 size-4" />
                            Ajouter un chapitre
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <Button variant="outline" size="sm" onClick={() => openNewCourse(mod.id)}>
                    <Plus className="mr-1 size-4" />
                    Ajouter un cours
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal : Ajouter un cours */}
      <Modal
        open={courseModal}
        onClose={() => {
          setCourseModal(false);
          setCourseModuleId(null);
        }}
        title="Ajouter un cours"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCourse();
          }}
          className="space-y-4"
        >
          <Input
            label="Titre du cours"
            value={courseForm.title}
            onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ex. Maintenance préventive"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-facam-dark">
              Description (optionnel)
            </label>
            <textarea
              value={courseForm.description}
              onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Courte description du cours..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'Création…' : 'Créer le cours'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setCourseModal(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal : Ajouter un chapitre (titre, description, vidéo YouTube, quiz) */}
      <Modal
        open={chapterModal === 'new'}
        onClose={() => {
          setChapterModal(null);
          setChapterCourseId(null);
        }}
        title="Ajouter un chapitre"
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
            placeholder="Ex. Introduction à la vidéo"
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
          <Input
            label="Titre de la vidéo (YouTube)"
            value={chapterForm.videoTitle}
            onChange={(e) => setChapterForm((f) => ({ ...f, videoTitle: e.target.value }))}
            placeholder="Ex. Démonstration maintenance"
          />
          <Input
            label="Lien de la vidéo (YouTube)"
            value={chapterForm.videoUrl}
            onChange={(e) => setChapterForm((f) => ({ ...f, videoUrl: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <Input
            label="Ordre"
            type="number"
            min={1}
            value={chapterForm.order}
            onChange={(e) =>
              setChapterForm((f) => ({ ...f, order: Number.parseInt(e.target.value, 10) || 1 }))
            }
          />
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <p className="text-sm font-medium text-facam-dark mb-2">Quiz de fin de chapitre</p>
            <p className="text-xs text-gray-500 mb-3">
              Score minimum requis pour valider le chapitre (optionnel).
            </p>
            <QuizBuilder
              title="Questions"
              questions={chapterQuizQuestions}
              onChange={setChapterQuizQuestions}
              minScoreToPass={chapterQuizMinScore}
              onMinScoreChange={setChapterQuizMinScore}
            />
          </div>
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
    </div>
  );
}
